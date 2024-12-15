from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any
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


##### SEARCH SCHEMA #####

class SearchResult(BaseModel):
    """Schema for search results"""
    title: str = Field(description="Title of the search result")
    link: str = Field(description="Link to the search result")
    snippet: str = Field(description="Snippet of the search result")
    displayLink: str = Field(description="Display link of the search result")
    pagemap: Optional[Dict[str, Any]] = {}
    relevance_score: float = Field(
        default=0.0,
        description="AI-generated relevance score from 0-100",
        ge=0.0,
        le=100.0
    )


class FetchURLsRequest(BaseModel):
    """Request model for fetching multiple URLs"""
    urls: List[str] = Field(description="List of URLs to fetch content from")


class URLContent(BaseModel):
    """Schema for URL content response"""
    url: str
    title: str
    text: str
    error: str = ""


##### RESEARCH SCHEMA #####


class QuestionAnalysis(BaseModel):
    """Schema for question analysis results"""
    key_components: List[str] = Field(
        description="Key components identified in the question"
    )
    scope_boundaries: List[str] = Field(
        description="Identified boundaries and scope of the question"
    )
    success_criteria: List[str] = Field(
        description="Criteria for a successful answer"
    )
    conflicting_viewpoints: List[str] = Field(
        description="Potential conflicting viewpoints to consider"
    )

    model_config = ConfigDict(from_attributes=True)
