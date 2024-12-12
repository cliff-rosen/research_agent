from sqlalchemy.orm import Session
import logging
from typing import List, Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor
import requests
from config.settings import settings
from schemas import SearchResult

NUM_RESULTS = settings.GOOGLE_SEARCH_NUM_RESULTS

logger = logging.getLogger(__name__)

def google_search(query: str, 
                 api_key: str, 
                 cx: str, 
                 num_results: int = 10, 
                 language: str = 'en',
                 safe: str = 'off') -> List[Dict]:
    """
    Perform a Google search using the Custom Search API.
    
    Args:
        query (str): The search query
        api_key (str): Your Google API key
        cx (str): Your Custom Search Engine ID
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
        # Make the API request
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        
        # Parse the response
        data = response.json()
        
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
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"An error occurred during Google search: {str(e)}")
        return []

async def search(db: Session, query: str, user_id: int = 0) -> List[SearchResult]:
    """
    Perform web search for the given query using Google Custom Search API
    
    Args:
        db (Session): Database session
        query (str): Search query
        user_id (int): ID of the user performing the search
        
    Returns:
        List[SearchResult]: List of search results from the web
    """
    logger.info(f"Performing web search for query: {query}")
    
    try:
        # Run Google Custom Search API call in a thread pool since it's synchronous
        with ThreadPoolExecutor() as executor:
            results = await asyncio.get_event_loop().run_in_executor(
                executor,
                google_search,
                query,
                settings.GOOGLE_SEARCH_API_KEY,
                settings.GOOGLE_SEARCH_ENGINE_ID,
                NUM_RESULTS  # Number of results
            )
        
        # Transform results to match our SearchResult schema
        return [
            SearchResult(
                title=result["title"],
                link=result["link"],
                snippet=result["snippet"],
                displayLink=result["displayLink"],
                pagemap=result["pagemap"]
            )
            for result in results
        ]
        
    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return [] 