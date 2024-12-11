import logging
import logging.handlers
import os
from datetime import datetime
from .settings import settings

def setup_logging():
    # Create logs directory if it doesn't exist
    if not os.path.exists(settings.LOG_DIR):
        os.makedirs(settings.LOG_DIR)

    # Generate filename with timestamp
    current_time = datetime.now().strftime("%Y%m%d")
    log_filename = os.path.join(
        settings.LOG_DIR, 
        f"{settings.LOG_FILENAME_PREFIX}_{current_time}.log"
    )

    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )

    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Create file handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_filename,
        maxBytes=settings.LOG_MAX_BYTES,
        backupCount=settings.LOG_BACKUP_COUNT
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)

    # Remove existing handlers to avoid duplicates
    root_logger.handlers = []

    # Add handlers to root logger
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Create logger for this module
    logger = logging.getLogger(__name__)
    logger.info(f"Logging setup complete. Writing to {log_filename}")

    return logger 