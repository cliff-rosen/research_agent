from sqlalchemy.orm import Session
import logging
from googlesearch import search as google_search
from typing import List, Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

def _perform_google_search(query: str, num_results: int = 5) -> List[Dict]:
    """
    Helper function to perform Google search
    """
    try:
        results = []
        for idx, result in enumerate(google_search(query, num_results), 1):
            results.append({
                "topic_id": idx,  # Using index as mock topic_id
                "topic_name": query,
                "relevance_score": 1.0 - (idx * 0.1),  # Simple relevance scoring
                "matched_content": result,
                "source": "web"
            })
        return results
    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return []

async def search(db: Session, query: str, user_id: int = 0) -> List[Dict]:
    """
    Perform web search for the given query
    
    Args:
        db (Session): Database session
        query (str): Search query
        user_id (int): ID of the user performing the search
        
    Returns:
        List[Dict]: List of search results from the web
    """
    logger.info(f"Performing web search for query: {query}")
    
    # Since googlesearch is synchronous, run it in a thread pool
    with ThreadPoolExecutor() as executor:
        results = await asyncio.get_event_loop().run_in_executor(
            executor,
            _perform_google_search,
            query
        )
    
    if not results:
        logger.warning(f"No results found for query: {query}")
        return []
        
    return results 