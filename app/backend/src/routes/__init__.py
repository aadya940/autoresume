"""Contains various routes for the Backend API."""

from routes.serve_pdf import serve_pdf_router
from routes.update import update_resume_router
from routes.clear import clear_resume_router
from routes.settings import save_settings_router
from routes.cover_letter import cover_letter_router

__all__ = [
    "serve_pdf_router",
    "update_resume_router",
    "clear_resume_router",
    "save_settings_router",
    "cover_letter_router",
]
