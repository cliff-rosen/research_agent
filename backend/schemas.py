from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum

##### USER SCHEMA #####


class UserBase(BaseModel):
    """Base schema for user data"""
    email: EmailStr = Field(description="User's email address")


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(
        min_length=5,
        description="User's password",
        example="securepassword123"
    )


class UserResponse(UserBase):
    """Schema for user responses"""
    user_id: int = Field(description="Unique identifier for the user")
    registration_date: datetime = Field(description="When the user registered")

    model_config = ConfigDict(from_attributes=True)


##### AUTH SCHEMA #####

class Token(BaseModel):
    """Schema for authentication tokens"""
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Type of token")
    username: str = Field(description="User's username")


class TokenData(BaseModel):
    """Schema for token payload data"""
    email: Optional[str] = Field(
        default=None, description="User's email from token")
    user_id: Optional[int] = Field(
        default=None, description="User's ID from token")
    username: Optional[str] = Field(
        default=None, description="User's username")


##### TOPIC SCHEMA #####

class TopicCreate(BaseModel):
    """Schema for creating a new topic"""
    topic_name: str = Field(
        min_length=1,
        max_length=255,
        description="Name of the topic",
        example="Machine Learning Fundamentals"
    )


class TopicUpdate(BaseModel):
    """Schema for updating a topic (PATCH)"""
    topic_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Updated name of the topic",
        example="Advanced Machine Learning"
    )


class TopicResponse(BaseModel):
    """Schema for topic responses"""
    topic_id: int = Field(description="Unique identifier for the topic")
    user_id: int = Field(description="ID of the user who owns this topic")
    topic_name: str = Field(description="Name of the topic")
    creation_date: datetime = Field(description="When the topic was created")
    entry_count: int = Field(
        description="Number of entries in this topic", default=0)
    is_uncategorized: bool = Field(
        default=False, description="Whether this is the uncategorized topic")

    model_config = ConfigDict(from_attributes=True)


class TopicList(BaseModel):
    """Schema for paginated topic lists"""
    items: List[TopicResponse]
    total: int = Field(ge=0)


class TopicSearchResponse(TopicResponse):
    score: float
    is_ai_suggested: bool = False
    is_new_topic: bool = False

    model_config = ConfigDict(from_attributes=True)


class TopicSuggestionResponse(BaseModel):
    suggested_name: str

