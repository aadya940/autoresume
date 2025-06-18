"""Route to update the Resume using ProcessPoolExecutor."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import asyncio
import aiofiles

from ai.crawl import InfoExtractor
from ai.prompts import (
    build_generic_prompt,
    build_editing_prompt,
    build_job_optimize_prompt,
)
from ai import append_and_compile
from ai.utils import read_file

# Import lifecycle management
from . import _lifecycle

from task_queue import task_queue

from pydantic import BaseModel
from typing import List, Optional

import logging
import traceback

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PDF Status dict global dict definition
pdf_status = {}
pdf_status["ready"] = False


class LinkRequest(BaseModel):
    links: List[str]
    feedback: Optional[str] = ""
    joblink: Optional[str] = ""


update_resume_router = APIRouter()
status_lock = asyncio.Lock()


async def run_in_process(func, *args):
    """Run function in process with error handling"""
    executor = _lifecycle.get_executor()

    loop = asyncio.get_running_loop()
    try:
        return await loop.run_in_executor(executor, func, *args)
    except Exception as e:
        logger.error(f"Process execution failed: {str(e)}")
        raise


async def task_runner(user_info, prompt, links=None):
    """Task runner that executes in the main event loop but yields control"""
    logger.info("Task runner started")

    try:
        logger.info("Starting append_and_compile")
        await append_and_compile(
            user_info,
            "assets/user_file.tex",
            "assets",
            prompt=prompt,
            lock_config={"status_lock": status_lock, "pdf_status": pdf_status},
        )
        logger.info("append_and_compile completed successfully")

        if links:
            # Thread-safe file append
            async with status_lock:
                async with aiofiles.open("assets/link_cache.txt", mode="a") as f:
                    for link in links:
                        await f.write(link + "\n")

    except Exception as e:
        logger.error(f"Error in task_runner: {str(e)}")
        logger.error(traceback.format_exc())

        logger.info("Task runner completed")


# Fully inside a separate OS process
def blocking_update_resume(links: List[str], prompt=None):
    logger.info(f"Received links: {links}")

    extractor = InfoExtractor()

    # This part involves Crawl4AI & Playwright, which spawns subprocesses
    relevant_info = asyncio.run(extractor.get_extracted_text(urls=links))
    logger.info(f"Extracted info: {relevant_info}")

    curr_code = read_file("assets/user_file.tex")
    if prompt is None:
        curr_prompt = build_generic_prompt(relevant_info, curr_code)
    else:
        curr_prompt = prompt

    # Return data to main process
    return relevant_info, curr_prompt


# Update the resume with links. Later we will implement
# functionality to update resume with feedback.
async def _update_with_links(links):
    try:
        # Run scraping inside ProcessPoolExecutor (already non-blocking)
        relevant_info, curr_prompt = await run_in_process(blocking_update_resume, links)
        logger.info(relevant_info)

        # Schedule PDF generation task in queue without awaiting (fire-and-forget)
        task = asyncio.create_task(
            task_queue.put(lambda: task_runner(relevant_info, curr_prompt, links=links))
        )

        # Add error callback for background task
        task.add_done_callback(
            lambda t: (
                logger.error(f"Background task failed: {t.exception()}")
                if t.exception()
                else None
            )
        )

        return JSONResponse(
            content={"message": "Resume update task with links started."},
            status_code=202,
        )

    except Exception as e:
        logger.error(f"Error in update_resume: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)


# Update the resume with feedback only (no crawling)
async def _update_with_feedback(feedback):
    try:
        # Read current resume code
        curr_code = read_file("assets/user_file.tex")

        # Build the editing prompt using feedback
        curr_prompt = build_editing_prompt(feedback, curr_code)

        # No relevant_info needed, just pass empty or dummy dict
        relevant_info = {}

        # Schedule PDF generation task (fire-and-forget)
        task = asyncio.create_task(
            task_queue.put(lambda: task_runner(relevant_info, curr_prompt))
        )

        # Add error callback for background task
        task.add_done_callback(
            lambda t: (
                logger.error(f"Background task failed: {t.exception()}")
                if t.exception()
                else None
            )
        )

        return JSONResponse(
            content={"message": "Resume editing task started."}, status_code=202
        )

    except Exception as e:
        logger.error(f"Error in update_with_feedback: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)


def _extract_job_desc(job_link):
    extractor = InfoExtractor(mode="job_desc")
    job_description = asyncio.run(extractor.get_extracted_text(urls=[job_link]))
    return job_description


async def _update_with_job_link(job_link):
    try:
        logger.info(f"Received Job link: {job_link}")
        curr_code = read_file("assets/user_file.tex")

        job_description = await run_in_process(_extract_job_desc, job_link)

        logger.info("Job Description extracted: \n", job_description)
        curr_prompt = build_job_optimize_prompt(job_description, curr_code)

        task = asyncio.create_task(
            task_queue.put(lambda: task_runner(job_description, curr_prompt))
        )

        # Add error callback for background task
        task.add_done_callback(
            lambda t: (
                logger.error(f"Background task failed: {t.exception()}")
                if t.exception()
                else None
            )
        )

        return JSONResponse(
            content={"message": "Resume Optimizing Task started."}, status_code=202
        )

    except Exception as e:
        logger.error(f"Error in update_with_job_link: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)


@update_resume_router.post("/update-resume")
async def update_resume(payload: LinkRequest):
    try:
        # Safe file reading with existence check
        try:
            async with aiofiles.open("assets/link_cache.txt") as f:
                curr_links = [line.strip() async for line in f]
        except FileNotFoundError:
            curr_links = []

        links_in_request = payload.links
        links = list(set(links_in_request) - set(curr_links))
        feedback = payload.feedback

        job_link = payload.joblink

        logger.info(f"Links Received: {links}")

        # Run tasks in background with proper error handling
        tasks = []

        if len(links) > 0:
            tasks.append(asyncio.create_task(_update_with_links(links)))

        if len(feedback) > 0:
            tasks.append(asyncio.create_task(_update_with_feedback(feedback)))

        if job_link and job_link.strip():
            tasks.append(asyncio.create_task(_update_with_job_link(job_link)))

        # Add error callbacks to all tasks
        for task in tasks:
            task.add_done_callback(
                lambda t: (
                    logger.error(f"Main task failed: {t.exception()}")
                    if t.exception()
                    else None
                )
            )

        return JSONResponse(
            content={"message": "Resume update and feedback tasks started."},
            status_code=202,
        )

    except Exception as e:
        logger.error(f"Error in update_resume endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(content={"error": str(e)}, status_code=500)
