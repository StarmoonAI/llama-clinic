from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.db.supabase import create_supabase_client
from app.utils.light_rag import light_rag_instance

router = APIRouter()


class RagTextRequest(BaseModel):
    text: str


light_rag_instance_ = light_rag_instance()


@router.post("/rag_text")
async def process_rag_text(text_input: RagTextRequest):
    try:
        # Input validation
        input_text = text_input.text
        if not input_text.strip():
            raise HTTPException(status_code=400, detail="Empty text is not allowed")

        print(f"Processing request data: {text_input}")

        await light_rag_instance_.ainsert(input_text)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Text processed successfully",
                "text_length": len(input_text),
            },
        )

    except Exception as e:
        print(f"Error processing text: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")
