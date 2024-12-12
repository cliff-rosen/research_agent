import anthropic
import logging
from typing import Optional
from config.settings import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-sonnet-20240229"  # or your preferred Claude model

    async def generate(self, prompt: str, max_tokens: Optional[int] = 1000) -> str:
        """
        Generate a response using Anthropic's Claude API.
        
        Args:
            prompt (str): The input prompt for Claude
            max_tokens (Optional[int]): Maximum number of tokens in the response
            
        Returns:
            str: The generated response
            
        Raises:
            Exception: If the API call fails
        """
        try:
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            return message.content[0].text

        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            raise

    async def close(self):
        """Cleanup method to close the client session"""
        await self.client.close()

# Create a singleton instance
ai_service = AIService() 