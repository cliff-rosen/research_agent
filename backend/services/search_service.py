from sqlalchemy.orm import Session
import logging
from typing import List, Dict
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


async def score_results(query: str, results: List[SearchResult]) -> List[SearchResult]:
    """
    Score search results using the AI model to determine relevance to the query

    Args:
        query (str): The original search query
        results (List[SearchResult]): List of search results to score

    Returns:
        List[SearchResult]: Scored and sorted search results
    """
    if not results:
        return results

    # Prepare results for AI scoring
    results_text = "\n".join([
        f"Title: {r.title}\nURL: {r.link}\nSnippet: {r.snippet}\n"
        for r in results
    ])

    prompt = f"""Given the search query: "{query}"

Please analyze these search results and assign a relevance score from 0-100 for each result based on how well it answers or relates to the query. 
Consider factors like:
- Direct relevance to the query topic
- Information completeness
- Source credibility
- Content freshness (if apparent)

Respond with only numbers separated by newlines, one score per result:

{results_text}"""

    try:
        # Get scores from AI
        scores_text = await ai_service.generate(prompt, max_tokens=500)
        scores = [float(score.strip())
                  for score in scores_text.strip().split('\n')]

        # Pair results with scores and sort
        scored_results = list(zip(results, scores))
        scored_results.sort(key=lambda x: x[1], reverse=True)

        # Update results with scores and return sorted list
        for result, score in scored_results:
            result.relevance_score = score

        return [result for result, _ in scored_results]

    except Exception as e:
        logger.error(f"Error scoring results: {str(e)}")
        return results


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
        scored_results = await score_results(query, search_results)
        return scored_results

    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return []

async def search_1(query: str) -> List[SearchResult]:
    collected_pages = {}
    kb = []
    
    # build collected_pages from query
    query_list = expand_query(query)
    urls = get_urls_from_query_list(query_list)
    for url in urls:
        page = get_page_from_url(url)
        collected_pages[url] = page

    # build kb from collected_pages
    for page in collected_pages:
        relevant_info = get_relevant_info_from_page(query, page)
        kb.append(relevant_info)

async def expand_query(query: str) -> List[str]:
    # use ai_service to expand query
    query_expansion = await ai_service.expand_query(query)
    return query_expansion

async def  get_urls_from_query_list(query_list: List[str]) -> List[str]:
    # TODO: implement this
    return []

async def get_page_from_url(url: str) -> str:
    # TODO: implement this
    return ""

async def get_relevant_info_from_page(query: str, page: str) -> str:
    # TODO: implement this
    return ""

