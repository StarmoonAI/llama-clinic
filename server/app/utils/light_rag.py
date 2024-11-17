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
from app.core.config import settings


WORKING_DIR = "/Users/joeyxiong/Desktop/parakeet/code/llama-clinic/server/files"


# async def llm_model_func(
#     prompt, system_prompt=None, history_messages=[], **kwargs
# ) -> str:
#     return await openai_complete_if_cache(
#         model="llama-3.1-8b-instant",
#         prompt=prompt,
#         system_prompt=system_prompt,
#         history_messages=history_messages,
#         # api_key=os.getenv("UPSTAGE_API_KEY"),
#         api_key=settings.GROQ_API_KEY,
#         base_url="https://api.groq.com/openai/v1",
#         **kwargs,
#     )


async def llm_model_func(
    prompt, system_prompt=None, history_messages=[], **kwargs
) -> str:
    headers = {
        "Content-Type": "application/json",
        "api-key": settings.REALTIME_API_KEY,
    }
    endpoint = "https://starmoonai.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    if history_messages:
        messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})

    payload = {
        "messages": messages,
        "temperature": kwargs.get("temperature", 0),
        "top_p": kwargs.get("top_p", 1),
        "n": kwargs.get("n", 1),
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(endpoint, headers=headers, json=payload) as response:
            if response.status != 200:
                raise ValueError(
                    f"Request failed with status {response.status}: {await response.text()}"
                )
            result = await response.json()
            return result["choices"][0]["message"]["content"]


async def embedding_func(texts: list[str]) -> np.ndarray:
    headers = {
        "Content-Type": "application/json",
        "api-key": settings.REALTIME_API_KEY,
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
