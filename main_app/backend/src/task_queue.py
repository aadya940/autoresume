import asyncio

task_queue = asyncio.Queue()


async def queue_worker():
    while True:
        coro_factory = await task_queue.get()  # ← this is a function
        try:
            await coro_factory()  # ← call it, await the coroutine it returns
        except Exception as e:
            print(f"[Queue Error] {e}")
        finally:
            task_queue.task_done()
