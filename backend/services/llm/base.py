from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any, AsyncGenerator
import time
import logging

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Base class for LLM providers"""

    @abstractmethod
    def get_default_model(self) -> str:
        """Get the default model for this provider"""
        pass

    @abstractmethod
    async def generate(self,
                       prompt: str,
                       model: Optional[str] = None,
                       max_tokens: Optional[int] = None
                       ) -> str:
        """Generate a response from the LLM"""
        pass

    @abstractmethod
    async def generate_stream(self,
                             prompt: str,
                             model: Optional[str] = None,
                             max_tokens: Optional[int] = None
                             ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from the LLM"""
        pass

    @abstractmethod
    async def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        system: Optional[str] = None,
        **kwargs: Any
    ) -> str:
        """Create a chat completion with the given messages"""
        raise NotImplementedError

    @abstractmethod
    async def create_chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        system: Optional[str] = None,
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        """Create a streaming chat completion with the given messages"""
        raise NotImplementedError

    @abstractmethod
    async def close(self):
        """Cleanup resources"""
        pass

    def _log_request_stats(self,
                           method: str,
                           model: str,
                           start_time: float,
                           input_tokens: int,
                           output_tokens: int):
        duration = time.time() - start_time
        logger.info(
            f"LLM Request Stats - Method: {method}, Model: {model}, "
            f"Duration: {duration:.2f}s, Input Tokens: {input_tokens}, "
            f"Output Tokens: {output_tokens}, Total Tokens: {input_tokens + output_tokens}"
        )
