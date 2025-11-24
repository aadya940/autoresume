from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
import logging
import json
from task_queue import broker
from .update import active_tasks

logger = logging.getLogger(__name__)

sse_router = APIRouter()


@sse_router.get("/api/events")
async def sse_endpoint():
    """
    Server-Sent Events endpoint to stream task status updates.
    Yields 'data: ready' when all active tasks are completed.
    """

    async def event_generator():
        while True:
            if not active_tasks:
                # No active tasks, send ready signal
                # We send it periodically to ensure client stays connected and knows it's ready
                yield f"data: ready\n\n"
                await asyncio.sleep(2)  # Check every 2 seconds if empty
                continue

            # Check status of active tasks
            all_completed = True
            completed_tasks = []

            # Iterate over a COPY
            for task_id in active_tasks[:]:
                try:
                    result = await broker.result_backend.get_result(task_id)

                    if result is not None:
                        completed_tasks.append(task_id)
                        if hasattr(result, "is_err") and result.is_err:
                            logger.error(f"Task {task_id} failed: {result.error}")
                    else:
                        all_completed = False
                except Exception:
                    all_completed = False

            # Clean up completed tasks
            for task_id in completed_tasks:
                if task_id in active_tasks:
                    active_tasks.remove(task_id)

            if all_completed and not active_tasks:
                yield f"data: ready\n\n"
            else:
                # Optional: Send progress or keep-alive
                yield f"data: processing\n\n"

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
