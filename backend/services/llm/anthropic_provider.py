import anthropic
import logging
from typing import List, Dict, Optional
from config.settings import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)

class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        
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
            logger.error(f"Error generating Anthropic response with model {model}: {str(e)}")
            raise

    async def create_chat_completion(self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        try:
            model = model or self.get_default_model()
            message = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=messages
            )
            return message.content[0].text
        except Exception as e:
            logger.error(f"Error creating Anthropic chat completion with model {model}: {str(e)}")
            raise

    async def close(self):
        await self.client.close() 