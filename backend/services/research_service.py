from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Optional
from config.settings import settings
from services.ai_service import ai_service
from services.search_service import google_search, score_and_rank_results
from schemas import SearchResult, QuestionAnalysis
from fastapi.responses import StreamingResponse
import json
import asyncio

logger = logging.getLogger(__name__)


class ResearchService:
    def __init__(self):
        self.search_wrapper = None

    async def execute_queries(self, db: Session, queries: List[str], user_id: int) -> List[SearchResult]:
        """
        Execute multiple search queries and return collated, deduplicated results.

        Args:
            db (Session): Database session
            queries (List[str]): List of search queries to execute
            user_id (int): ID of the user performing the search

        Returns:
            List[SearchResult]: List of unique search results from all queries, sorted by relevance
        """
        try:
            logger.info(f"Executing {len(queries)} queries")

            # Execute all queries and collect raw results
            all_raw_results = []
            for query in queries:
                results = await google_search(query)
                all_raw_results.extend(results)

            # Deduplicate by link before converting to SearchResult objects
            unique_raw_results = {}
            for result in all_raw_results:
                if result["link"] not in unique_raw_results:
                    unique_raw_results[result["link"]] = result

            # Convert unique results to SearchResult objects
            unique_results = [
                SearchResult(
                    title=result["title"],
                    link=result["link"],
                    snippet=result["snippet"],
                    displayLink=result["displayLink"],
                    pagemap=result["pagemap"],
                    relevance_score=0.0  # Initialize score
                )
                for result in unique_raw_results.values()
            ]

            # Score all unique results against all queries and keep highest score
            result_scores = {}
            for query in queries:
                scored_results = await score_and_rank_results(query, unique_results)
                for result in scored_results:
                    if result.link not in result_scores or result.relevance_score > result_scores[result.link]:
                        result_scores[result.link] = result.relevance_score

            # Apply the highest scores back to the unique results
            for result in unique_results:
                result.relevance_score = result_scores[result.link]

            # Sort by relevance score
            unique_results.sort(key=lambda x: x.relevance_score, reverse=True)

            return unique_results

        except Exception as e:
            logger.error(f"Error executing queries: {str(e)}")
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

    async def analyze_question_scope_stream(self, question: str):
        """
        Stream the question analysis process.
        """
        try:
            logger.info(f"Analyzing question (streaming): {question}")
            
            async for chunk in ai_service.analyze_question_scope_stream(question):
                # Stream the markdown text directly
                yield chunk

        except Exception as e:
            logger.error(f"Error in streaming analysis: {str(e)}")
            yield "Error analyzing question. Please try again.\n"


# Create a singleton instance
research_service = ResearchService()

# Export the singleton instance
__all__ = ['research_service']
