"""Route to poll the status of the PDF Editing."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from .update import pdf_status

polling_router = APIRouter()


@polling_router.get("/pdf-status")
async def get_pdf_status():
    return JSONResponse(content={"ready": pdf_status["ready"]})
