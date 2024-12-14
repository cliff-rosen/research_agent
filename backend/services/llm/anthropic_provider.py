import anthropic
import logging
from typing import List, Dict, Optional, Any
from config.settings import settings
from .base import LLMProvider
import aiohttp
import ssl
import certifi

DEFAULT_MAX_TOKENS = 1024  # Default max tokens for Claude-3
logger = logging.getLogger(__name__)


class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY)

    def get_default_model(self) -> str:
        return "claude-3-sonnet-20240229"

    async def generate(self,
                       prompt: str,
                       model: Optional[str] = None,
                       max_tokens: Optional[int] = None
                       ) -> str:
        try:
            model = model or self.get_default_model()
            max_tokens = max_tokens or DEFAULT_MAX_TOKENS
            
            message = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return message.content[0].text
        except Exception as e:
            logger.error(
                f"Error generating Anthropic response with model {model}: {str(e)}")
            raise

    async def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        system: Optional[str] = None
    ) -> str:
        try:
            model = model or self.get_default_model()
            max_tokens = max_tokens or DEFAULT_MAX_TOKENS
            
            # Build request parameters with required fields
            params = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens
            }
            
            # Add optional system parameter if provided
            if system is not None:
                params["system"] = system
                
            message = await self.client.messages.create(**params)
            return message.content[0].text
        except Exception as e:
            logger.error(
                f"Error creating Anthropic chat completion with model {model}: {str(e)}")
            raise

    async def close(self):
        await self.client.close()
