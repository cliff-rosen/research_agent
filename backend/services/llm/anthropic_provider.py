import anthropic
import logging
from typing import List, Dict, Optional, Any
from config.settings import settings
from .base import LLMProvider
import aiohttp
import ssl
import certifi

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
        system: Optional[str] = None,
        **kwargs: Any
    ) -> str:
        try:
            model = model or self.get_default_model()

            # Create the messages request with system parameter
            request = {
                "model": model,
                "messages": messages,
                "max_tokens": kwargs.get("max_tokens", 1024)
            }

            if system:
                request["system"] = system

            # Create SSL context with verified certificates
            ssl_context = ssl.create_default_context(cafile=certifi.where())

            # Use SSL context in ClientSession
            async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
                async with session.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json=request
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
                    return data["content"][0]["text"]
        except Exception as e:
            logger.error(
                f"Error creating Anthropic chat completion with model {model}: {str(e)}")
            raise

    async def close(self):
        await self.client.close()
