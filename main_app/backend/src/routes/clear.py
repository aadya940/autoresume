from fastapi import APIRouter
from fastapi.responses import JSONResponse
import asyncio
import logging

from utils import initialise_pdf, clear_pdf, clear_link_cache
from task_queue import task_queue
from .update import pdf_status  # Shared PDF status dict

# Create router
clear_resume_router = APIRouter()

# Lock to safely update PDF status
status_lock = asyncio.Lock()

# Setup logger
logger = logging.getLogger(__name__)


@clear_resume_router.post("/clear-resume")
async def clear_resume():
    """Route to clear and reset the resume PDF in background."""
    # Schedule task in queue
    asyncio.create_task(task_queue.put(lambda: _clear()))

    return JSONResponse(
        content={"message": "Resume clear task started."}, status_code=202
    )


async def _clear():
    """Async task to reset the PDF and link cache."""
    async with status_lock:
        pdf_status["ready"] = False
        logger.info("PDF status set to False")

    await asyncio.sleep(1)

    try:
        # Perform cleanup
        clear_pdf()
        initialise_pdf()
        clear_link_cache()
        logger.info("Cleared and re-initialized resume.")

    except Exception as e:
        logger.error(f"[Clear Resume Error] {e}", exc_info=True)

    finally:
        async with status_lock:
            pdf_status["ready"] = True
            logger.info("PDF status set to True")
