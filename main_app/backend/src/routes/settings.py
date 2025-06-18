from fastapi import APIRouter
from pydantic import BaseModel
import os
from dotenv import set_key

save_settings_router = APIRouter()


class SettingsRequest(BaseModel):
    google_api_key: str
    email: str


@save_settings_router.post("/save-settings")
async def save_settings(settings: SettingsRequest):
    google_api_key = settings.google_api_key
    email = settings.email

    # Save to environment variable
    os.environ["GOOGLE_API_KEY"] = google_api_key

    # Save to .env file
    set_key(".env", "GOOGLE_API_KEY", google_api_key)

    # Handle email
    await configure_email(email)

    return {"status": "success", "message": "Settings saved successfully"}


async def configure_email(email):
    """Handle email. (Add to a Database Service Maybe.)"""
    pass
