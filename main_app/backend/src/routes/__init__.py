"""Contains various routes for the Backend API."""

from .serve_pdf import serve_pdf_router
from .update import update_resume_router
from .clear import clear_resume_router
from .polling import polling_router
from .settings import save_settings_router

from ._lifecycle import lifespan
