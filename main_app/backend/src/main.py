from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from routes import (
    serve_pdf_router,
    update_resume_router,
    clear_resume_router,
    save_settings_router,
)
from routes.sse import sse_router


from utils import initialise_pdf


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)


origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("assets", exist_ok=True)

initialise_pdf()

app.include_router(serve_pdf_router)
app.include_router(update_resume_router)
app.include_router(clear_resume_router)
app.include_router(sse_router)
app.include_router(save_settings_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
