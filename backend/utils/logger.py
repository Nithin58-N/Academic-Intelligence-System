"""
Logging Configuration - uses stdlib logging + rich (available)
"""

import logging
import sys
from pathlib import Path
from rich.logging import RichHandler
from utils.config import settings


def setup_logger():
    """Configure application logger using rich."""
    log_dir = Path(settings.LOGS_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[
            RichHandler(rich_tracebacks=True, show_path=False),
            logging.FileHandler(log_dir / "academic_ai.log", encoding="utf-8"),
        ],
    )

    # Suppress noisy loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("academic_ai")
