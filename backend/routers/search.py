from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import SearchResult, URLContent, FetchURLsRequest
from services import auth_service, search_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


################## Search Routes ##################

@router.post(
    "/fetch-urls",
    response_model=List[URLContent],
    summary="Fetch and extract content from multiple URLs in parallel"
)
async def fetch_urls(request: FetchURLsRequest) -> List[URLContent]:
    """
    Fetch and extract content from multiple URLs in parallel.

    Args:
        request: FetchURLsRequest containing:
            - urls: List of URLs to fetch content from

    Returns:
        List of URLContent objects, each containing:
        - url: Original URL
        - title: Page title
        - text: Main content text
        - error: Error message if failed
    """
    try:
        return await search_service.fetch_urls_content(request.urls)
    except Exception as e:
        logger.error(f"Error in parallel URL fetching: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


### Unused

@router.get(
    "/search",
    response_model=List[SearchResult],
    summary="Search topics and their content with AI-powered relevance scoring",
    responses={
        200: {
            "description": "Search results successfully retrieved and scored",
            "model": List[SearchResult]
        },
        401: {"description": "Not authenticated"}
    }
)
async def search(
    query: str,
    num_results: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of results to return"
    ),
    min_score: float = Query(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Minimum relevance score threshold"
    ),
    current_user=Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Search across topics and their content with AI-powered relevance scoring

    Parameters:
    - **query**: Search query string
    - **num_results**: Number of results to return (1-50)
    - **min_score**: Minimum relevance score threshold (0-100)

    Returns a list of search results sorted by relevance score.
    Each result includes a relevance score indicating how well it matches the query.
    """
    logger.info(
        f"search endpoint called with query: {query}, num_results: {num_results}, min_score: {min_score}")

    # Get scored results
    results = await search_service.search(db, query, current_user.user_id)

    # Filter by minimum score and limit results
    filtered_results = [r for r in results if r.relevance_score >= min_score]
    return filtered_results[:num_results]


@router.get(
    "/fetch-url",
    response_model=URLContent,
    summary="Fetch and extract content from a given URL"
)
async def fetch_url(url: str = Query(..., description="URL to fetch content from")) -> URLContent:
    """
    Fetch and extract content from a given URL.

    Args:
        url: The URL to fetch content from

    Returns:
        URLContent object containing:
        - url: Original URL
        - title: Page title
        - text: Main content text
        - error: Error message if failed
    """
    try:
        # Since fetch_url_content already returns URLContent, don't wrap it again
        return await search_service.fetch_url_content(url)
    except Exception as e:
        logger.error(f"Error fetching URL content: {str(e)}")
        return URLContent(
            url=url,
            title="",
            text="",
            error=str(e)
        )
