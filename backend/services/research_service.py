from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Optional
from config.settings import settings
from services.ai_service import ai_service
from services.search_service import google_search, score_and_rank_results
from schemas import SearchResult, QuestionAnalysis, CurrentEventsCheck, ResearchEvaluation
import json
import asyncio

logger = logging.getLogger(__name__)


class ResearchService:
    def __init__(self):
        self.search_wrapper = None

    async def check_current_events_context_stream(self, question: str):
        """
        Stream the current events context check process.
        """
        try:
            logger.info(
                f"Checking current events context (streaming): {question}")

            async for chunk in ai_service.check_current_events_context_stream(question):
                yield chunk

        except Exception as e:
            logger.error(f"Error in streaming current events check: {str(e)}")
            yield "Error checking current events context. Please try again.\n"

    async def check_current_events_context(self, question: str) -> CurrentEventsCheck:
        """
        Check if a question requires current events context.
        """
        try:
            logger.info(f"Checking current events context: {question}")
            result = await ai_service.check_current_events_context(question)
            return CurrentEventsCheck(**result)

        except Exception as e:
            logger.error(f"Error checking current events context: {str(e)}")
            return CurrentEventsCheck(
                requires_current_context=False,
                reasoning="Error checking current events context",
                timeframe="",
                key_events=[],
                search_queries=[]
            )

    async def gather_current_events_context(self, check_result: CurrentEventsCheck) -> List[SearchResult]:
        """
        Gather current events context using the search queries from the check result.
        """
        try:
            logger.info(
                f"Gathering current events context with {len(check_result.search_queries)} queries")

            # Execute all search queries in parallel
            tasks = [asyncio.create_task(
                self._search_with_query(query)) for query in check_result.search_queries]

            all_results = []
            seen_urls = set()

            # Collect and deduplicate results
            for completed in asyncio.as_completed(tasks):
                search_result = await completed
                results = search_result.get('results', [])

                for result in results:
                    if result["link"] not in seen_urls:
                        seen_urls.add(result["link"])
                        search_result = SearchResult(
                            title=result["title"],
                            link=result["link"],
                            snippet=result["snippet"],
                            displayLink=result["displayLink"],
                            pagemap=result["pagemap"],
                            relevance_score=0.0
                        )
                        all_results.append(search_result)

            return all_results

        except Exception as e:
            logger.error(f"Error gathering current events context: {str(e)}")
            return []

    async def analyze_question_stream(self, question: str):
        """
        Stream the question analysis process.
        """
        try:
            logger.info(f"Analyzing question (streaming): {question}")

            # First, check if we need current events context
            check_result = await self.check_current_events_context(question)

            if check_result.requires_current_context:
                # If we need context, gather it first
                context_results = await self.gather_current_events_context(check_result)

                # Add context to the question
                context_summary = "\n\nCurrent Events Context:\n" + "\n".join([
                    f"- {result.title}: {result.snippet}"
                    # Use top 5 most relevant results
                    for result in context_results[:5]
                ])
                enhanced_question = question + context_summary
            else:
                enhanced_question = question

            # Now proceed with the regular analysis
            async for chunk in ai_service.analyze_question_stream(enhanced_question):
                yield chunk

        except Exception as e:
            logger.error(f"Error in streaming analysis: {str(e)}")
            yield "Error analyzing question. Please try again.\n"

    async def expand_question_stream(self, question: str):
        """
        Stream the question expansion process with detailed analysis and explanation.

        Args:
            question (str): The question to expand

        Yields:
            str: Markdown-formatted chunks of the expansion process
        """
        try:
            logger.info(f"Expanding question (streaming): {question}")

            async for chunk in ai_service.expand_query_stream(question):
                yield chunk

        except Exception as e:
            logger.error(f"Error in streaming expansion: {str(e)}")
            yield "Error expanding question. Please try again.\n"

    async def _search_with_query(self, query: str) -> Dict:
        """
        Wrapper around google_search that returns both results and original query.

        Args:
            query (str): The search query to execute

        Returns:
            Dict: Contains 'results' from google_search and original 'query'
        """
        try:
            results = await google_search(query)
            return {
                'query': query,
                'results': results
            }
        except Exception as e:
            logger.error(
                f"Error in search wrapper for query '{query}': {str(e)}")
            return {
                'query': query,
                'results': [],
                'error': str(e)
            }

    async def execute_queries_stream(self, queries: List[str]):
        """
        Stream the search results for multiple queries.
        Results are streamed as JSON chunks in the same format as execute_queries.
        Each result is scored using the query that originally found it.

        Args:
            queries (List[str]): List of search queries to execute

        Yields:
            str: JSON chunks containing search results
        """
        try:
            logger.info(f"Executing {len(queries)} queries")

            # Track unique results and their source queries
            seen_urls = {}  # url -> (result_dict, source_query)
            pending_results = []  # List to collect results before scoring

            # Create tasks for parallel execution
            tasks = [asyncio.create_task(
                self._search_with_query(query)) for query in queries]

            # Execute queries concurrently
            for completed in asyncio.as_completed(tasks):
                try:
                    search_result = await completed
                    source_query = search_result['query']
                    results = search_result['results']

                    # Track new unique results with their source query
                    for result in results:
                        if result["link"] not in seen_urls:
                            seen_urls[result["link"]] = (result, source_query)
                            search_result = SearchResult(
                                title=result["title"],
                                link=result["link"],
                                snippet=result["snippet"],
                                displayLink=result["displayLink"],
                                pagemap=result["pagemap"],
                                relevance_score=0.0
                            )
                            pending_results.append(search_result)

                    # Score and stream this batch of results
                    if pending_results:
                        # Score all results from this query
                        scored_results = await score_and_rank_results(source_query, pending_results)
                        scored_results.sort(
                            key=lambda x: x.relevance_score, reverse=True)

                        # Stream results as JSON
                        results_json = [result.dict()
                                        for result in scored_results]
                        yield json.dumps(results_json) + "\n"

                        # Clear pending results
                        pending_results = []

                except Exception as e:
                    logger.error(f"Error processing search results: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error in streaming execution: {str(e)}")
            yield json.dumps({"error": str(e)}) + "\n"

    async def evaluate_answer(self, question: str, analysis: QuestionAnalysis, answer: str) -> ResearchEvaluation:
        """
        Evaluate how well an answer addresses a research question.

        Args:
            question (str): The original research question
            analysis (QuestionAnalysis): The analysis of the question's components
            answer (str): The answer to evaluate

        Returns:
            ResearchEvaluation: Detailed evaluation of the answer
        """
        try:
            logger.info(f"Evaluating answer for question: {question}")

            # Use AI service to evaluate the answer
            evaluation = await ai_service.evaluate_answer(
                question=question,
                key_components=analysis.key_components,
                scope_boundaries=analysis.scope_boundaries,
                success_criteria=analysis.success_criteria,
                answer=answer
            )

            return ResearchEvaluation(**evaluation)

        except Exception as e:
            logger.error(f"Error evaluating answer: {str(e)}")
            return ResearchEvaluation(
                completeness_score=0.0,
                accuracy_score=0.0,
                relevance_score=0.0,
                overall_score=0.0,
                missing_aspects=["Error occurred during evaluation"],
                improvement_suggestions=["Please try again"],
                conflicting_aspects=[{
                    "aspect": "Evaluation Error",
                    "conflict": f"An error occurred during evaluation: {str(e)}"
                }]
            )

    # DEPRECATED

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

            # Use AI service to analyze the question and get QuestionAnalysis model
            result = await ai_service.analyze_question(question)

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


# Create a singleton instance
research_service = ResearchService()

# Export the singleton instance
__all__ = ['research_service']
