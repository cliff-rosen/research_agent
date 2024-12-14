from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Optional, TypedDict
from config.settings import settings
from services.ai_service import ai_service

logger = logging.getLogger(__name__)


class QuestionAnalysis(TypedDict):
    key_components: List[str]
    scope_boundaries: List[str]
    success_criteria: List[str]
    conflicting_viewpoints: List[str]


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
        Analyze a question to determine its key components, scope, and success criteria.

        Args:
            question: The question to analyze

        Returns:
            QuestionAnalysis: Dictionary containing the analysis components
        """
        try:
            logger.info(f"Starting analysis for question: {question}")

            # Use AI service to analyze the question
            logger.debug("Calling AI service for question analysis...")
            analysis = await ai_service.analyze_question_scope(question)
            logger.debug(f"Received analysis from AI service: {analysis}")

            # Ensure we have all required components with defaults if missing
            result = QuestionAnalysis(
                key_components=analysis.get('key_components', []),
                scope_boundaries=analysis.get('scope_boundaries', []),
                success_criteria=analysis.get('success_criteria', []),
                conflicting_viewpoints=analysis.get(
                    'conflicting_viewpoints', [])
            )

            # Log the components we found
            logger.info(f"Analysis complete. Found {len(result['key_components'])} key components, "
                        f"{len(result['scope_boundaries'])} scope boundaries, "
                        f"{len(result['success_criteria'])} success criteria, and "
                        f"{len(result['conflicting_viewpoints'])} conflicting viewpoints")

            # Log detailed results at debug level
            logger.debug("Analysis results:")
            logger.debug(f"Key components: {result['key_components']}")
            logger.debug(f"Scope boundaries: {result['scope_boundaries']}")
            logger.debug(f"Success criteria: {result['success_criteria']}")
            logger.debug(
                f"Conflicting viewpoints: {result['conflicting_viewpoints']}")

            return result

        except Exception as e:
            logger.error(f"Error analyzing question: {str(e)}", exc_info=True)
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
