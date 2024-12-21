from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from database import get_db
from services import auth_service
from schemas import UserCreate, Token
from typing import Annotated

router = APIRouter()


@router.post(
    "/register",
    response_model=UserCreate,
    summary="Register a new user"
)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with:
    - **email**: valid email address
    - **password**: string
    """
    return await auth_service.create_user(db, user)


@router.post(
    "/login",
    response_model=Token,
    summary="Login to get JWT token",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "username": "john.doe"
                    }
                }
            }
        },
        401: {
            "description": "Invalid credentials"
        }
    }
)
async def login(
    username: Annotated[str, Form(description="User's email address")],
    password: Annotated[str, Form(description="User's password")],
    db: Session = Depends(get_db)
):
    """
    Login with email and password to get a JWT token.

    - **username**: email address
    - **password**: user password

    Returns:
    - **access_token**: JWT token to use for authentication
    - **token_type**: "bearer"
    - **username**: user's username
    """
    try:
        token = await auth_service.login_user(db, username, password)
        return token
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
