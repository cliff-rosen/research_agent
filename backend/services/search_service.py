from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Optional
import aiohttp
from config.settings import settings
from schemas import SearchResult, URLContent
from services.ai_service import ai_service
import ssl
import certifi
from bs4 import BeautifulSoup
import asyncio
import bleach
import httpx
from fastapi import HTTPException
NUM_RESULTS = settings.GOOGLE_SEARCH_NUM_RESULTS

logger = logging.getLogger(__name__)


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


async def fetch_url_content(url: str) -> URLContent:

    # Configure allowed HTML tags and attributes
    ALLOWED_TAGS = [
        'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'div', 'span', 'img'
    ]

    ALLOWED_ATTRIBUTES = {
        '*': ['class'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
    }       

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(str(url), follow_redirects=True)
            response.raise_for_status()
            
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = soup.title.string if soup.title else "No title found"
        
        # Clean up the content
        # Remove script and style elements
        for script in soup(["script", "style", "iframe", "noscript"]):
            script.decompose()

        # Find the main content area (this is a simple heuristic - might need adjustment)
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
       
        # Sanitize the HTML content
        cleaned_html = bleach.clean(
            str(main_content),
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRIBUTES,
            strip=True
        )            
        return URLContent   (
            url=url,
            title=title,
            text=cleaned_html,
            content_type='html'
        )
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")    


async def fetch_urls_content(urls: List[str]) -> List[URLContent]:
    """
    Fetch and extract content from multiple URLs in parallel.

    Args:
        urls (List[str]): List of URLs to fetch content from

    Returns:
        List[URLContent]: List of URL contents, with error messages for failed fetches
    """
    try:
        # Create tasks for all URLs
        tasks = [fetch_url_content(url) for url in urls]

        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results, converting exceptions to error messages
        processed_results = []
        for url, result in zip(urls, results):
            if isinstance(result, Exception):
                # If the result is an exception, create an error URLContent
                processed_results.append(URLContent(
                    url=url,
                    title="",
                    text="",
                    content_type="text",
                    error=str(result)
                ))
            else:
                # If successful, use the result directly
                processed_results.append(result)

        return processed_results
    except Exception as e:
        logger.error(f"Error in parallel URL fetching: {str(e)}")
        raise
