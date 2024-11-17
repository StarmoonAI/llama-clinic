import asyncio
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
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
        **kwargs,
    )


async def embedding_func(texts: list[str]) -> np.ndarray:
    headers = {
        "Content-Type": "application/json",
        "api-key": os.getenv("REALTIME_API_KEY"),
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


rag = LightRAG(
    working_dir=WORKING_DIR,
    llm_model_func=llm_model_func,
    embedding_func=EmbeddingFunc(
        embedding_dim=3072,
        max_token_size=8192,
        func=embedding_func,
    ),
)


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


client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-70b-versatile"


def retrieve_medical_information(query: str):
    """
    Retrieve medical information from the knowledge base.
    """
    return rag.query(query, param=QueryParam(mode="hybrid"))


tools = [
    {
        "type": "function",
        "function": {
            "name": "retrieve medical information",
            "description": "general medical information and patients' medical records knowledge base",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The query to retrieve medical information",
                    }
                },
                "required": ["query"],
            },
        },
    }
]


def run_conversation(user_prompt):
    messages = [
        {
            "role": "system",
            "content": "You are a function calling LLM that uses the data obtained from the functions to answer questions around medical information and patients' medical records.",
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]

    response = client.chat.completions.create(
        model=MODEL, messages=messages, tools=tools, tool_choice="auto", max_tokens=4096
    )
