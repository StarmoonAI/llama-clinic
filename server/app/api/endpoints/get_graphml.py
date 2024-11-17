import asyncio
import json
import os
import time
from fastapi import APIRouter, HTTPException
from app.models.text_input import TextInput
from fastapi.responses import FileResponse, StreamingResponse
from app.models.text_analysis_output import TextAnalysisOutput
from app.services.llm_response import openai_response

router = APIRouter()


@router.get("/get_graphml")
async def get_graphml():
    try:
        file_path = f"/Users/joeyxiong/Desktop/parakeet/code/llama-clinic/server/files/graph_chunk_entity_relation.graphml"

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(path=file_path, media_type="application/graphml+xml")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
