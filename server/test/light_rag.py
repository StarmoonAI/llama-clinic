import asyncio
import json
import os

import aiohttp
import numpy as np
import textract
from groq import Groq
from lightrag import LightRAG, QueryParam
from lightrag.llm import (
    gpt_4o_complete,
    gpt_4o_mini_complete,
    openai_complete_if_cache,
    openai_embedding,
)
from lightrag.utils import EmbeddingFunc

WORKING_DIR = "/Users/joeyxiong/Desktop/parakeet/code/starmoon-private/backend/files"


async def llm_model_func(
    prompt, system_prompt=None, history_messages=[], **kwargs
) -> str:
    return await openai_complete_if_cache(
        model="llama-3.1-70b-versatile",
        prompt=prompt,
        system_prompt=system_prompt,
        history_messages=history_messages,
        # api_key=os.getenv("UPSTAGE_API_KEY"),
        api_key="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",
        base_url="https://api.groq.com/openai/v1",
        **kwargs,
    )


async def embedding_func(texts: list[str]) -> np.ndarray:
    headers = {
        "Content-Type": "application/json",
        "api-key": "FToHqHlJs5B9zhdlJ8uymoi6C6g2I3GVrJGuC99oCephOkqmHwvNJQQJ99AKACHYHv6XJ3w3AAABACOGq6m0",
    }
    endpoint = "https://starmoonai.openai.azure.com/openai/deployments/text-embedding-3-large/embeddings?api-version=2023-05-15"

    payload = {"input": texts}

    async with aiohttp.ClientSession() as session:
        async with session.post(endpoint, headers=headers, json=payload) as response:
            if response.status != 200:
                raise ValueError(
                    f"Request failed with status {response.status}: {await response.text()}"
                )
            result = await response.json()
            embeddings = [item["embedding"] for item in result["data"]]
            return np.array(embeddings)


def light_rag_instance():
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=llm_model_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=3072,
            max_token_size=8192,
            func=embedding_func,
        ),
    )
    return rag


# rag = LightRAG(
#     working_dir=WORKING_DIR,
#     llm_model_func=llm_model_func,
#     embedding_func=EmbeddingFunc(
#         embedding_dim=3072,
#         max_token_size=8192,
#         func=embedding_func,
#     ),
# )


# async def test_funcs():
#     result = await llm_model_func("How are you?")
#     print("Resposta do llm_model_func: ", result)

#     result = await embedding_func(["How are you?"])
#     print("Resultado do embedding_func: ", result.shape)
#     print("Dimensão da embedding: ", result.shape[1])


# asyncio.run(test_funcs())

# ----------------------------

# ! For PDF files
# file_path = f"{WORKING_DIR}/the-little-orange-book-2021.pdf"
# text_content = textract.process(file_path)
# rag.insert(text_content.decode("utf-8"))

# ! For TXT files
# with open(f"{WORKING_DIR}/book.txt") as f:
#     rag.insert(f.read())

# ! Query
# print(rag.query("What is the little orange book?", param=QueryParam(mode="hybrid")))


# import random

# import networkx as nx
# from pyvis.network import Network

# # Load the GraphML file
# G = nx.read_graphml(f"{WORKING_DIR}/graph_chunk_entity_relation.graphml")

# # Create a Pyvis network
# net = Network(height="100vh", notebook=True)

# # Convert NetworkX graph to Pyvis network
# net.from_nx(G)

# # Add colors to nodes
# for node in net.nodes:
#     node["color"] = "#{:06x}".format(random.randint(0, 0xFFFFFF))

# # Save and display the network
# net.show("knowledge_graph.html")


client = Groq(api_key="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")
MODEL = "llama-3.2-90b-vision-preview"


# Dummy function to get cash loan details
def medical_information_tool(query):
    """
    A tool that retrieves medical information and patient's health records from the database.
    """
    return rag.query(query, param=QueryParam(mode="hybrid"))


# adding functions info into tools list
tools = [
    {
        "type": "function",
        "function": {
            "name": "medical_information_tool",
            "description": "A tool that uses the data extracted from the functions to answer questions about medical information and patient's healthcare records.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Query related to medical information and patient's health records.",
                    }
                },
                "required": ["query"],
            },
        },
    },
]


def run_conversation(user_prompt):

    messages = [
        {
            "role": "system",
            "content": "You are a function calling LLM that uses the data extracted from the functions to answer questions about medical information. Don't mention anything about tool in response.",
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]

    response = client.chat.completions.create(
        model=MODEL, messages=messages, tools=tools, tool_choice="auto", max_tokens=4096
    )

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    print("tool_calls+++", tool_calls)
    print("response_message+++", response_message)

    # checking if function calling required
    if tool_calls:
        available_functions = {
            "medical_information_tool": medical_information_tool,
        }
        messages.append(response_message)

        for tool_call in tool_calls:
            # extracting the tool information
            function_name = tool_call.function.name
            function_to_call = available_functions[function_name]
            function_args = json.loads(tool_call.function.arguments)
            function_response = function_to_call(**function_args)

            print("function_response+++", function_response)

            # adding response from tool/function to chat template
            messages.append(
                {
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": function_response,
                }
            )

        # getting the final response using function response
        second_response = client.chat.completions.create(model=MODEL, messages=messages)
        final_response = second_response.choices[0].message.content

    else:
        response = client.chat.completions.create(
            model=MODEL, messages=messages, max_tokens=4096
        )
        messages.append(response_message)
        final_response = response.choices[0].message.content

    return final_response


user_prompt = "What is the little orange book? Can you explain it to me?"
print(run_conversation(user_prompt))
