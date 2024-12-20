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
    content_type: str = 'text'  # One of: 'html', 'markdown', 'code', 'text'


##### RESEARCH SCHEMA #####


class CurrentEventsCheck(BaseModel):
    """Schema for current events context check results"""
    requires_current_context: bool = Field(
        description="Whether the question requires current events context"
    )
    reasoning: str = Field(
        description="Explanation of why current context is or isn't needed"
    )
    timeframe: str = Field(
        description="If context is needed, how recent should the context be"
    )
    key_events: List[str] = Field(
        description="Key events or developments to look for"
    )
    search_queries: List[str] = Field(
        description="Suggested search queries to gather context"
    )

    model_config = ConfigDict(from_attributes=True)


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


class ExecuteQueriesRequest(BaseModel):
    """Request model for executing multiple search queries"""
    queries: List[str] = Field(description="List of search queries to execute")


class GetResearchAnswerRequest(BaseModel):
    """Request model for getting research answers"""
    question: str = Field(description="The research question to answer")
    source_content: List[URLContent] = Field(
        description="List of URL content to analyze")


class EvaluateAnswerRequest(BaseModel):
    """Request model for evaluating research answers"""
    question: str = Field(description="The original research question")
    analysis: QuestionAnalysis = Field(
        description="The analysis of the question's components")
    answer: str = Field(description="The answer to evaluate")


class ResearchEvaluation(BaseModel):
    """Schema for evaluating how well an answer addresses a question"""
    completeness_score: float = Field(
        description="Score for how completely the answer addresses all aspects of the question (0-100)",
        ge=0.0,
        le=100.0
    )
    accuracy_score: float = Field(
        description="Score for factual accuracy of the answer (0-100)",
        ge=0.0,
        le=100.0
    )
    relevance_score: float = Field(
        description="Score for how relevant the answer is to the question (0-100)",
        ge=0.0,
        le=100.0
    )
    overall_score: float = Field(
        description="Overall evaluation score (0-100)",
        ge=0.0,
        le=100.0
    )
    missing_aspects: List[str] = Field(
        description="Key aspects of the question that were not addressed in the answer"
    )
    improvement_suggestions: List[str] = Field(
        description="Specific suggestions for improving the answer"
    )
    conflicting_aspects: List[Dict[str, str]] = Field(
        description="Aspects of the answer that conflict with requirements or have internal inconsistencies",
        default_factory=list,
        example=[
            {
                "aspect": "Timeline of events",
                "conflict": "Answer states the event occurred in 2020 but later references it happening in 2021"
            },
            {
                "aspect": "Scope boundary",
                "conflict": "Answer discusses European markets when question specifically asked about Asian markets"
            }
        ]
    )

    model_config = ConfigDict(from_attributes=True)


class ResearchAnswer(BaseModel):
    """Schema for final research answer"""
    answer: str = Field(description="Final synthesized answer")
    sources_used: List[str] = Field(
        description="List of sources used in the answer")
    confidence_score: float = Field(
        description="Confidence score for the answer (0-100)",
        ge=0.0,
        le=100.0
    )

    model_config = ConfigDict(from_attributes=True)
