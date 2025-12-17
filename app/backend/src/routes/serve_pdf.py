from fastapi.responses import FileResponse, JSONResponse
from fastapi import APIRouter

from utils import read_file

import os

serve_pdf_router = APIRouter()


@serve_pdf_router.get("/api/serve_pdf")
async def serve_pdf(file_type: str = "pdf", download: bool = False, cover_letter: bool = False):

    # Determine filename based on cover_letter flag
    if cover_letter:
        if file_type == "tex":
            filename: str = "generated_cover_letter.tex"
            media_type = "application/x-tex"
        else:
            filename: str = "generated_cover_letter.pdf"
            media_type = "application/pdf"
    else:
        if file_type == "tex":
            filename: str = "user_file.tex"
            media_type = "application/x-tex"
        else:
            filename: str = "user_file.pdf"
            media_type = "application/pdf"

    assets_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
    file_path = os.path.join(assets_dir, filename)

    if not os.path.exists(file_path):
        return {"error": "File not found"}

    if file_type == "pdf" or download:
        return FileResponse(
            file_path,
            media_type=media_type,
            filename=filename,
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
            },
        )

    return JSONResponse(content={"code": read_file(file_path)})
