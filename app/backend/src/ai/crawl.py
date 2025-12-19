import os
import json
import logging
from typing import List, Optional, Dict
from crawl4ai import (
    AsyncWebCrawler,
    CrawlerRunConfig,
    LLMConfig,
    BrowserConfig,
    CacheMode,
)
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from dotenv import load_dotenv
from urllib.parse import urlparse
from functools import lru_cache

from .prompts import SCRAPER_LLM_INSTRUCTION_GENERIC, SCRAPER_LLM_INSTRUCTION_JOB

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InfoExtractor:
    def __init__(self, mode=None):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY required")

        self.browser_config = BrowserConfig(
            browser_type="chromium",
            headless=True,
            viewport_width=1280,
            viewport_height=720,
        )

        self.llm_config = LLMConfig(
            provider="gemini/gemini-3-flash-preview", api_token=api_key
        )

        self.extra_args = {"temperature": 0, "top_p": 0.9, "max_tokens": 2000}

        if mode is None:
            _instruction = SCRAPER_LLM_INSTRUCTION_GENERIC
        elif mode == "job_desc":
            _instruction = SCRAPER_LLM_INSTRUCTION_JOB

        self.crawler_config = CrawlerRunConfig(
            cache_mode=CacheMode.DISABLED,
            word_count_threshold=1,
            extraction_strategy=LLMExtractionStrategy(
                llm_config=self.llm_config,
                instruction=_instruction,
                extra_args=self.extra_args,
                chunk_token_threshold=500,
            ),
            exclude_all_images=True,
            exclude_external_links=True,  # Faster parsing
            magic=True,
            wait_until="domcontentloaded",  # Faster than "load"
            page_timeout=20000,  # Reduced timeout
            delay_before_return_html=0.5,  # Minimal delay
            mean_delay=0.1,  # Faster between requests
            max_range=0.3,
        )

        self.async_crawler = AsyncWebCrawler(config=self.browser_config)

    @staticmethod
    @lru_cache(maxsize=1000)
    def _is_valid_url(url: str) -> bool:
        """Cached URL validation for better performance."""
        try:
            result = urlparse(url)
            return bool(result.scheme and result.netloc)
        except Exception:
            return False

    async def scrape_many(self, urls: List[str]) -> List[Optional[Dict]]:
        if not urls:
            return []

        valid_urls = [url for url in urls if InfoExtractor._is_valid_url(url)]

        async with self.async_crawler as crawler:
            results = await crawler.arun_many(
                urls=valid_urls, config=self.crawler_config
            )

            processed = []
            for result in results:
                if result and result.success and result.extracted_content:
                    processed.append(result.extracted_content)
                else:
                    processed.append(None)

            # Map back to original URL order
            final_results = []
            valid_idx = 0
            for url in urls:
                if url.startswith(("http://", "https://")):
                    final_results.append(
                        processed[valid_idx] if valid_idx < len(processed) else None
                    )
                    valid_idx += 1
                else:
                    final_results.append(None)

            return final_results

    async def get_extracted_text(self, urls: List[str]) -> str:
        results = await self.scrape_many(urls)
        output = []

        for i, content in enumerate(results, 1):
            if not content:
                output.append(f"=== Source {i} ===\n[No content extracted]\n")
                continue

            try:
                data = json.loads(content)
                if not isinstance(data, list):
                    data = [data] if isinstance(data, dict) else []

                formatted = f"=== Source {i} ===\n"
                for item in data:
                    if isinstance(item, dict):
                        tag = (
                            item.get("tags", ["unknown"])[0]
                            if item.get("tags")
                            else "unknown"
                        )
                        formatted += f"\n--- {tag.upper()} ---\n"
                        for entry in item.get("content", []):
                            if entry:
                                formatted += f"- {entry}\n"
                output.append(formatted)

            except Exception as e:
                logger.error(f"Error processing source {i}: {e}")
                output.append(f"=== Source {i} ===\n[Error decoding JSON]\n")

        return "\n".join(output)
