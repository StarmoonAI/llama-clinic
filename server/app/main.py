import asyncio
import random
import threading
from contextlib import asynccontextmanager
from queue import Queue

import uvicorn
from app.api.endpoints import (
    analyze_text,
    db_user,
    generate_token,
    starmoon,
    create_friendly_slug,
    hardware_auth,
    rag,
    rag_text,
    rag_text_family_history,
    get_graphml,
)
from app.core.config import settings
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import nltk

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab")

load_dotenv()

app = FastAPI()


origins = [
    "http://mydomain.com",
    "https://mydomain.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_text.router, prefix="/api", tags=["LLM response"])
app.include_router(db_user.router, prefix="/api", tags=["User"])
app.include_router(generate_token.router, prefix="/api", tags=["Token"])
app.include_router(create_friendly_slug.router, prefix="/api", tags=["Token"])
app.include_router(hardware_auth.router, prefix="/api", tags=["Token"])
app.include_router(rag.router, prefix="/api", tags=["RAG"])
app.include_router(rag_text.router, prefix="/api", tags=["RAG"])
app.include_router(rag_text_family_history.router, prefix="/api", tags=["RAG"])
app.include_router(get_graphml.router, prefix="/api", tags=["RAG"])
app.include_router(starmoon.router, tags=["StarMoon WebSocket"])


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        # host="127.0.0.1",
        port=8000,
        debug=True,
        reload=True,
        ws_ping_interval=900,
        ws_ping_timeout=900,
    )
