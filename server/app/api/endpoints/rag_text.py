from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.db.supabase import create_supabase_client

router = APIRouter()

class TextInput(BaseModel):
    text: str

@router.post("/rag_text")
async def process_rag_text(text_input: TextInput):
    try:
        # Get the text from the request body
        input_text = text_input.text
        
        # Here you can add your text processing logic
        # For example:
        # - Store it in Supabase
        # - Process it with an LLM
        # - Run it through a RAG pipeline
        # - etc.
        
        # Placeholder for processing logic
        processed_text = input_text.upper()  # Example: just converts to uppercase
        print(processed_text)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Text processed successfully",
                "processed_text": processed_text
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing text: {str(e)}"
        )