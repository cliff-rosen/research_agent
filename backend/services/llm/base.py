from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any


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
    async def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
<<<<<<< HEAD
        max_tokens: Optional[int] = None,
        system: Optional[str] = None
=======
        system: Optional[str] = None,
        **kwargs: Any
>>>>>>> 943675de674dba8cb36a3fe628909a3ab50db119
    ) -> str:
        """Create a chat completion with the given messages"""
        raise NotImplementedError

    @abstractmethod
    async def close(self):
        """Cleanup resources"""
        pass
