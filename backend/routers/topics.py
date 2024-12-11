from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import (
    TopicResponse, TopicCreate, TopicUpdate
)
from services import topic_service, auth_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


################## CRUD Routes ##################

@router.post(
    "/",
    response_model=TopicResponse,
    summary="Create a new topic",
    responses={
        200: {
            "description": "Topic successfully created",
            "model": TopicResponse
        },
        401: {
            "description": "Not authenticated"
        },
        422: {
            "description": "Validation error"
        }
    }
)
async def create_topic(
    topic: TopicCreate,
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    logger.info("create_topic endpoint called")

    return await topic_service.create_topic(db, topic, current_user.user_id)    


@router.get(
    "/",
    response_model=List[TopicResponse],
    summary="Get all topics for the current user",
    responses={
        200: {
            "description": "List of topics successfully retrieved",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/TopicResponse"}
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def get_topics(
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """Get all topics for the authenticated user"""
    logger.info("get_topics endpoint called")

    return await topic_service.get_topics(db, current_user.user_id)


#update topic
@router.patch(
    "/{topic_id}",
    response_model=TopicResponse,
    summary="Update a topic",
    responses={
        200: {
            "description": "Topic successfully updated",
            "content": {
                "application/json": {
                    "example": {
                        "topic_id": 1,
                        "user_id": 123,
                        "topic_name": "Advanced Machine Learning",
                        "creation_date": "2024-03-13T12:00:00Z"
                    }
                }
            }
        },
        401: {"description": "Not authenticated"},
        403: {"description": "Topic belongs to another user"},
        404: {"description": "Topic not found"},
        422: {"description": "Validation error"}
    }
)
async def update_topic(
    topic_id: int,
    topic: TopicUpdate,
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Update a topic for the authenticated user
    
    Parameters:
    - **topic_id**: ID of the topic to update
    - **topic_name**: New name for the topic
    """
    logger.info(f"update_topic endpoint called for topic_id: {topic_id}")
    return await topic_service.update_topic(db, topic_id, topic, current_user.user_id)

@router.delete(
    "/{topic_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a topic",
    responses={
        204: {"description": "Topic successfully deleted"},
        401: {"description": "Not authenticated"},
        403: {"description": "Topic belongs to another user"},
        404: {"description": "Topic not found"}
    }
)
async def delete_topic(
    topic_id: int,
    current_user = Depends(auth_service.validate_token),
    db: Session = Depends(get_db)
):
    """
    Delete a topic and all its associated entries
    
    Parameters:
    - **topic_id**: ID of the topic to delete
    """
    logger.info(f"delete_topic endpoint called for topic_id: {topic_id}")
    await topic_service.delete_topic(db, topic_id, current_user.user_id)
    return None
