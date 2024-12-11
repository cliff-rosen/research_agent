from sqlalchemy.orm import Session
from models import Topic
from schemas import (
    TopicCreate, TopicUpdate, TopicResponse
)
from fastapi import HTTPException, status
import logging
from datetime import datetime
from sqlalchemy import func

logger = logging.getLogger(__name__)


################## CRUD Services ##################

async def create_topic(db: Session, topic: TopicCreate, user_id: int):
    db_topic = Topic(topic_name=topic.topic_name, user_id=user_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic 


async def get_topics(db: Session, user_id: int):
    logger.info(f"Getting topics for user {user_id}")
    
    # Get topics with entry counts using a subquery
    logger.info(f"Getting entry counts")
    entry_counts = (
        db.query(
            Entry.topic_id, 
            func.count(Entry.entry_id).label('entry_count')
        )
        .filter(Entry.user_id == user_id)
        .group_by(Entry.topic_id)
        .subquery()
    )
    
    # Get topics with their counts
    logger.info(f"Getting topics with counts")
    topics = (
        db.query(Topic, func.coalesce(entry_counts.c.entry_count, 0).label('entry_count'))
        .outerjoin(entry_counts, Topic.topic_id == entry_counts.c.topic_id)
        .filter(Topic.user_id == user_id)
        .all()
    )
    
    # Get uncategorized count
    uncategorized_count = (
        db.query(func.count(Entry.entry_id))
        .filter(Entry.user_id == user_id, Entry.topic_id.is_(None))
        .scalar() or 0
    )
    
    # Convert to list of Topic objects with entry_count attribute
    result = []
    
    # Add uncategorized "topic" first
    logger.info(f"Adding uncategorized topic with count {uncategorized_count}")
    result.append(TopicResponse(
        topic_id=0,  # UNCATEGORIZED_TOPIC_ID
        topic_name="Uncategorized",
        user_id=user_id,
        creation_date=datetime.utcnow(),
        entry_count=uncategorized_count,
        is_uncategorized=True
    ).model_dump())
    
    # Add regular topics with their counts
    for topic, count in topics:
        topic.entry_count = count
        result.append(topic)
    
    return result


async def update_topic(db: Session, topic_id: int, topic_update: TopicUpdate, user_id: int):
    """Update a topic if it belongs to the user"""
    try:
        # Get existing topic
        db_topic = db.query(Topic).filter(Topic.topic_id == topic_id).first()
        if not db_topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
            
        # Verify ownership
        if db_topic.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Topic belongs to another user"
            )
            
        # Update only if new value provided (PATCH behavior)
        if topic_update.topic_name is not None:
            db_topic.topic_name = topic_update.topic_name
            
        db.commit()
        db.refresh(db_topic)
        logger.info(f"Updated topic {topic_id} for user {user_id}")
        return db_topic
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating topic: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update topic"
        )


async def delete_topic(db: Session, topic_id: int, user_id: int):
    """Delete a topic and all its associated entries if it belongs to the user"""
    try:
        # Get existing topic
        db_topic = db.query(Topic).filter(Topic.topic_id == topic_id).first()
        if not db_topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic not found"
            )
            
        # Verify ownership
        if db_topic.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Topic belongs to another user"
            )
            
        # Delete associated entries first
        db.query(Entry).filter(Entry.topic_id == topic_id).delete()
        
        # Delete the topic
        db.delete(db_topic)
        db.commit()
        
        logger.info(f"Deleted topic {topic_id} and its entries for user {user_id}")
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting topic: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete topic"
        )

