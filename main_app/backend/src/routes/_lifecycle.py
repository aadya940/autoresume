"""Application lifecycle management."""

from contextlib import asynccontextmanager
from concurrent.futures import ProcessPoolExecutor
import logging

logger = logging.getLogger(__name__)

# Global executor
executor = None


def init_executor():
    """Initialize executor"""
    global executor
    if executor is None:
        executor = ProcessPoolExecutor()
        logger.info("Process executor initialized")


def cleanup_executor():
    """Cleanup executor"""
    global executor
    if executor:
        executor.shutdown(wait=True)
        executor = None
        logger.info("Process executor cleaned up")


def get_executor():
    """Get the global executor, initializing if needed"""
    global executor
    if executor is None:
        init_executor()
    return executor


@asynccontextmanager
async def lifespan():
    """FastAPI lifespan manager"""
    # Startup
    logger.info("Starting up application...")
    init_executor()

    yield

    # Shutdown
    logger.info("Shutting down application...")
    cleanup_executor()
