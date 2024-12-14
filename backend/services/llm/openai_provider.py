from openai import AsyncOpenAI
import logging
from typing import List, Dict, Optional
from config.settings import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
    def get_default_model(self) -> str:
        return "gpt-4-turbo-preview"

    async def generate(self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        try:
            model = model or self.get_default_model()
            response = await self.client.completions.create(
                model=model,
                prompt=prompt,
                max_tokens=max_tokens
            )
            return response.choices[0].text.strip()
        except Exception as e:
            logger.error(f"Error generating OpenAI response with model {model}: {str(e)}")
            raise

    async def create_chat_completion(self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        system: Optional[str] = None
    ) -> str:
        try:
            model = model or self.get_default_model()
            
            # Add system message if provided
            chat_messages = []
            if system:
                chat_messages.append({"role": "system", "content": system})
            chat_messages.extend(messages)
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=chat_messages,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error creating OpenAI chat completion with model {model}: {str(e)}")
            raise

    async def close(self):
        await self.client.close() 