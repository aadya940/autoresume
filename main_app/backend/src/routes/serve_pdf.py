from fastapi.responses import FileResponse, JSONResponse
from fastapi import APIRouter

from utils import read_file

import os

serve_pdf_router = APIRouter()


@serve_pdf_router.get("/api/serve_pdf")
async def serve_pdf(file_type: str = "pdf"):

    if file_type == "tex":
        filename: str = "user_file.tex"
    else:
        filename: str = "user_file.pdf"

    assets_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
    file_path = os.path.join(assets_dir, filename)

    if not os.path.exists(file_path):
        return {"error": "File not found"}

    if file_type == "pdf":
        return FileResponse(
            file_path,
            media_type="application/pdf",
            filename=filename,
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
            },
        )

    return JSONResponse(content={"code": read_file(file_path)})
