from sqlalchemy.orm import Session
import logging
from typing import List
from config.settings import settings
from services.ai_service import ai_service
from schemas import QuestionAnalysis

logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        self.search_wrapper = None

    async def expand_question(self, question: str) -> List[str]:
        """
        Expand a question into multiple related queries using AI.

        Args:
            question (str): The question to expand

        Returns:
            List[str]: List of expanded queries
        """
        try:
            logger.info(f"Expanding question: {question}")
            expanded_queries = await ai_service.expand_query(question)
            
            # Filter out empty queries and strip whitespace
            filtered_queries = [q.strip() for q in expanded_queries if q.strip()]
            
            return filtered_queries

        except Exception as e:
            logger.error(f"Error expanding question: {str(e)}")
            return []

    async def analyze_question(self, question: str) -> QuestionAnalysis:
        """
        Analyze a question to identify its core components, scope, and success criteria.

        Args:
            question (str): The question to analyze

        Returns:
            QuestionAnalysis: Pydantic model containing the analysis components
        """
        try:
            logger.info(f"Analyzing question: {question}")
            
            # Use AI service to analyze the question
            analysis = await ai_service.analyze_question_scope(question)
            
            # Create QuestionAnalysis model instance
            result = QuestionAnalysis(
                key_components=analysis.get('key_components', []),
                scope_boundaries=analysis.get('scope_boundaries', []),
                success_criteria=analysis.get('success_criteria', []),
                conflicting_viewpoints=analysis.get('conflicting_viewpoints', [])
            )
            
            return result

        except Exception as e:
            logger.error(f"Error analyzing question: {str(e)}")
            return QuestionAnalysis(
                key_components=[],
                scope_boundaries=[],
                success_criteria=[],
                conflicting_viewpoints=[]
            )

# Create a singleton instance
research_service = ResearchService()

# Export the singleton instance
__all__ = ['research_service'] 