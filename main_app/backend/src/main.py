from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from routes import (
    serve_pdf_router,
    update_resume_router,
    clear_resume_router,
    polling_router,
    save_settings_router,
)

# Cleanups (Relase ProcessPool)
from routes import lifespan as _lifespan

from utils import initialise_pdf

from task_queue import queue_worker

from contextlib import asynccontextmanager
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background task
    worker_task = asyncio.create_task(queue_worker())

    async with _lifespan():
        yield  # Let FastAPI run

    # Optionally cancel background task on shutdown
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan)


origins = [
    "*",
    "http://localhost:5173",  # Your frontend's origin
    "http://127.0.0.1:5173",  # In case you use this address
    "http://localhost:8000",  # Optional: if you want to test from the backend itself
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
app.include_router(polling_router)
app.include_router(save_settings_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
