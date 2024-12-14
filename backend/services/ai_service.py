import logging
from typing import Optional, List, Dict, TypedDict
from config.settings import settings
from .llm.base import LLMProvider
from .llm.anthropic_provider import AnthropicProvider
from .llm.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

EXPAND_QUERY_PROMPT = """
You are a search query expansion expert that helps users find comprehensive information by generating relevant alternative search queries. Expand the following query into a list of related queries separated by newlines: 
{query}\
"""

ANALYZE_QUESTION_PROMPT = """You are an expert research analyst. Analyze the given question based on these criteria:
1. Key Components: Identify the main elements that need to be addressed
2. Scope Boundaries: Define clear limits and constraints for the investigation
3. Success Criteria: Specify what constitutes a complete and satisfactory answer
4. Conflicting Viewpoints: Identify potential areas of disagreement or different perspectives

Focus on questions that:
- Require multiple sources and synthesis of information
- Span multiple subject areas or disciplines
- Have potential for conflicting information
- Need specific, detailed answers with evidence

Provide your analysis in a structured format with these exact keys:
- key_components
- scope_boundaries
- success_criteria
- conflicting_viewpoints"""

class AIService:
    def __init__(self):
        self.provider: LLMProvider = AnthropicProvider()

    def set_provider(self, provider: str):
        """Change the LLM provider"""
        if provider == "openai":
            self.provider = OpenAIProvider()
        elif provider == "anthropic":
            self.provider = AnthropicProvider()
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def expand_query(self, 
        query: str, 
        model: Optional[str] = None
    ) -> List[str]:
        """
        Expand a query into related queries
        
        Args:
            query: The query to expand
            model: Optional specific model to use
        """
        prompt = EXPAND_QUERY_PROMPT.format(query=query)
        query_expansion = await self.provider.generate(
            prompt=prompt, 
            model=model,
            max_tokens=500
        )
        return query_expansion.split("\n")

    async def analyze_question_scope(self, 
        question: str,
        model: Optional[str] = None
    ) -> Dict[str, List[str]]:
        """
        Analyze a question to determine its key components, scope, and success criteria.
        
        Args:
            question: The question to analyze
            model: Optional specific model to use
        """
        try:
            messages = [
                {"role": "system", "content": ANALYZE_QUESTION_PROMPT},
                {"role": "user", "content": f"Analyze this question: {question}"}
            ]
            
            content = await self.provider.create_chat_completion(
                messages=messages,
                model=model
            )
            
            # Initialize default structure
            analysis = {
                "key_components": [],
                "scope_boundaries": [],
                "success_criteria": [],
                "conflicting_viewpoints": []
            }
            
            # Parse the content into our structure
            current_section = None
            for line in content.split('\n'):
                line = line.strip()
                if not line:
                    continue
                    
                # Check for section headers
                if line.lower().startswith('key components'):
                    current_section = "key_components"
                    continue
                elif line.lower().startswith('scope boundaries'):
                    current_section = "scope_boundaries"
                    continue
                elif line.lower().startswith('success criteria'):
                    current_section = "success_criteria"
                    continue
                elif line.lower().startswith('conflicting viewpoints'):
                    current_section = "conflicting_viewpoints"
                    continue
                    
                # Add content to current section if it starts with a list marker
                if current_section and (line.startswith('-') or line.startswith('•')):
                    item = line.lstrip('- •').strip()
                    if item:
                        analysis[current_section].append(item)

            return analysis

        except Exception as e:
            logger.error(f"Error in analyze_question_scope: {str(e)}")
            return {
                "key_components": [],
                "scope_boundaries": [],
                "success_criteria": [],
                "conflicting_viewpoints": []
            }

    async def close(self):
        """Cleanup method to close the provider session"""
        await self.provider.close()

# Create a singleton instance
ai_service = AIService()

__all__ = ['ai_service'] 