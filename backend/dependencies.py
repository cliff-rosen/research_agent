from fastapi import Depends, HTTPException, Security
from services import auth_service
import logging
from typing import Annotated

logger = logging.getLogger(__name__)

async def get_current_user():
    """
    Extract and validate the bearer token from the Authorization header.
    This can be used as a dependency in other endpoints that need authentication.
    """
    try:
        logger.info("get_current_user called")
        return await auth_service.validate_token()
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Create a reusable dependency

CurrentUser = Annotated[dict, Depends(get_current_user)]