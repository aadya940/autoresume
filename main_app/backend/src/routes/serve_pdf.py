from fastapi.responses import FileResponse
from fastapi import APIRouter

import os

serve_pdf_router = APIRouter()


@serve_pdf_router.get("/serve_pdf")
async def serve_pdf():
    filename: str = "user_file.pdf"
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
    file_path = os.path.join(assets_dir, filename)

    if not os.path.exists(file_path):
        return {"error": "File not found"}

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
    )
