from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Optional
import aiohttp
from config.settings import settings
from schemas import SearchResult
from services.ai_service import ai_service
import ssl
import certifi

NUM_RESULTS = settings.GOOGLE_SEARCH_NUM_RESULTS

logger = logging.getLogger(__name__)


async def google_search(query: str,
                        api_key: str = settings.GOOGLE_SEARCH_API_KEY,
                        cx: str = settings.GOOGLE_SEARCH_ENGINE_ID,
                        num_results: int = NUM_RESULTS,
                        language: str = 'en',
                        safe: str = 'off') -> List[Dict]:
    """
    Perform a Google search using the Custom Search API.

    Args:
        query (str): The search query
        api_key (str): Your Google API key (defaults to settings.GOOGLE_SEARCH_API_KEY)
        cx (str): Your Custom Search Engine ID (defaults to settings.GOOGLE_SEARCH_ENGINE_ID)
        num_results (int): Number of results to return (max 10 per request)
        language (str): Language code for results (e.g., 'en' for English)
        safe (str): Safe search setting ('off', 'medium', or 'high')

    Returns:
        List[Dict]: List of search results, each containing 'title', 'link', and 'snippet'
    """
    base_url = "https://www.googleapis.com/customsearch/v1"

    params = {
        'key': api_key,
        'cx': cx,
        'q': query,
        'num': num_results,
        'hl': language,
        'safe': safe
    }

    try:
        # Create SSL context with verified certificates
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        # Use the SSL context in the ClientSession
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
            async with session.get(base_url, params=params) as response:
                response.raise_for_status()
                data = await response.json()

                # Check if there are search results
                if 'items' not in data:
                    return []

                # Extract relevant information from each result
                results = []
                for item in data['items']:
                    result = {
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'displayLink': item.get('displayLink', ''),
                        'pagemap': item.get('pagemap', {})
                    }
                    results.append(result)

                return results

    except aiohttp.ClientError as e:
        logger.error(f"API request failed: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"An error occurred during Google search: {str(e)}")
        return []


async def search(db: Session, query: str, user_id: int = 0) -> List[SearchResult]:
    """
    Perform web search for the given query using Google Custom Search API
    and score results using AI

    Args:
        db (Session): Database session
        query (str): Search query
        user_id (int): ID of the user performing the search

    Returns:
        List[SearchResult]: List of scored and sorted search results
    """
    logger.info(f"Performing web search for query: {query}")

    try:
        results = await google_search(query)

        # Transform results to match our SearchResult schema
        search_results = [
            SearchResult(
                title=result["title"],
                link=result["link"],
                snippet=result["snippet"],
                displayLink=result["displayLink"],
                pagemap=result["pagemap"],
                relevance_score=0.0  # Initialize score
            )
            for result in results
        ]

        # Score and sort results
        scored_results = await score_and_rank_results(query, search_results)
        return scored_results

    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return []


async def score_and_rank_results(query: str, results: List[SearchResult]) -> List[SearchResult]:
    """
    Score and rank search results based on relevance to the query.

    Args:
        query (str): The search query
        results (List[SearchResult]): List of search results to score

    Returns:
        List[SearchResult]: Scored and ranked results
    """
    try:
        # Convert SearchResult objects to dictionaries for AI scoring
        results_for_scoring = [
            {
                'url': result.link,
                'content': f"Title: {result.title}\nSnippet: {result.snippet}"
            }
            for result in results
        ]

        # Get scores from AI service
        scores = await ai_service.score_results(query, results_for_scoring)

        # Create a map of url to score
        score_map = {score['url']: score['score'] for score in scores}

        # Add scores to results
        scored_results = []
        for result in results:
            result_copy = result.copy()
            result_copy.relevance_score = score_map.get(result.link, 50.0)
            scored_results.append(result_copy)

        # Sort by score in descending order
        scored_results.sort(key=lambda x: x.relevance_score, reverse=True)

        return scored_results

    except Exception as e:
        logger.error(f"Error scoring results: {str(e)}")
        # Return original results with default score if scoring fails
        for result in results:
            result.relevance_score = 50.0
        return results

