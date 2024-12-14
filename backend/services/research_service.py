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
            filtered_queries = [q.strip()
                                for q in expanded_queries if q.strip()]

            return filtered_queries

        except Exception as e:
            logger.error(f"Error expanding question: {str(e)}")
            return []

    async def analyze_question_scope(self, question: str) -> QuestionAnalysis:
        """
        Analyze a question to identify its core components, scope, and success criteria.

        Args:
            question (str): The question to analyze

        Returns:
            QuestionAnalysis: Pydantic model containing the analysis components
        """
        try:
            logger.info(f"Analyzing question: {question}")
            
            # Use AI service to analyze the question and get QuestionAnalysis model
            result = await ai_service.analyze_question_scope(question)
            
            # Log analysis results using model attributes
            logger.info(
                f"Analysis complete. Found {len(result.key_components)} key components, "
                f"{len(result.scope_boundaries)} scope boundaries, "
                f"{len(result.success_criteria)} success criteria, and "
                f"{len(result.conflicting_viewpoints)} conflicting viewpoints"
            )
            
            return result

        except Exception as e:
            logger.error(f"Error analyzing question: {str(e)}")
            logger.info("Returning empty analysis due to error")
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
