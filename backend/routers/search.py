from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import SearchResult
from services import auth_service, search_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


################## Search Routes ##################

@router.get(
    "/search",
    response_model=List[SearchResult],
    summary="Search topics and their content",
    responses={
        200: {
            "description": "Search results successfully retrieved",
            "model": List[SearchResult]
        },
        401: {"description": "Not authenticated"}
    }
)
async def search(
    query: str,
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Search across topics and their content
    
    Parameters:
    - **query**: Search query string
    """
    logger.info(f"search_topics endpoint called with query: {query}")
    results = await search_service.search(db, query, current_user.user_id)
    # Convert Pydantic models to dictionaries
    return [result.model_dump() for result in results]


