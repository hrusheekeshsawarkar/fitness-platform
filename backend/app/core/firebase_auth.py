import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings
import logging
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
try:
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if os.path.exists(cred_path):
        logger.info(f"Using Firebase credentials from: {cred_path}")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'projectId': settings.FIREBASE_PROJECT_ID,
        })
    else:
        logger.warning(f"Firebase credentials file not found at {cred_path}. Using application default credentials.")
        # For development without credentials file
        firebase_admin.initialize_app(options={
            'projectId': settings.FIREBASE_PROJECT_ID,
        })
    logger.info("Firebase Admin SDK initialized successfully")
except ValueError as e:
    logger.warning(f"Firebase app already initialized: {str(e)}")
except Exception as e:
    logger.error(f"Error initializing Firebase: {str(e)}")
    raise

# Security scheme for token authentication
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Verify Firebase ID token and return user information.
    If no token is provided, this will return None.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        # Check if user is admin (you can customize this based on your needs)
        # For example, you might have a custom claim in Firebase for admin users
        is_admin = decoded_token.get("admin", False)
        
        return {
            "uid": uid,
            "email": email,
            "is_admin": is_admin
        }
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Verify Firebase ID token and return user information.
    If no token is provided, this will return None.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        # Check if user is admin
        is_admin = decoded_token.get("admin", False)
        
        return {
            "uid": uid,
            "email": email,
            "is_admin": is_admin
        }
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None

async def get_admin_user(user = Depends(get_current_user)):
    """
    Check if the user is an admin.
    """
    if not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user 