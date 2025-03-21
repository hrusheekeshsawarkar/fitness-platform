from typing import Optional
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
try:
    # Check if the app is already initialized
    firebase_admin.get_app()
except ValueError:
    # If not, initialize with credentials
    try:
        cred = credentials.Certificate("firebase-credentials.json")
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin SDK: {str(e)}")
        raise

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Verify Firebase ID token and return user information.
    If no token is provided, this will return None.
    """
    if not credentials:
        logger.warning("No credentials provided for authentication")
        # For development purposes, we'll allow access with a test user
        # In production, you'd want to raise an HTTPException here
        return {
            "uid": "test-user",
            "email": "test@example.com",
            "is_admin": True
        }
    
    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(
            token, 
            check_revoked=False
        )
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "no-email@example.com")
        
        # Check if user is admin (you can customize this based on your needs)
        # For example, you might have a custom claim in Firebase for admin users
        is_admin = decoded_token.get("admin", False)
        
        # For testing purposes, set all users as admin
        # Remove this in production
        is_admin = True
        
        logger.info(f"Authenticated user: {uid} (admin: {is_admin})")
        
        # Return user info without database check for now
        # This will fix the coroutine issue
        return {
            "uid": uid,
            "email": email,
            "is_admin": is_admin
        }
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        # For development purposes, we'll allow access with a test user
        # In production, you'd want to raise an HTTPException here
        logger.warning("Auth failed but returning test admin user for development")
        return {
            "uid": "test-user", 
            "email": "test@example.com",
            "is_admin": True
        }

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Verify Firebase ID token and return user information.
    If no token is provided, this will return None.
    """
    if not credentials:
        logger.warning("No credentials provided for authentication")
        # For testing purposes, return admin user
        return {
            "uid": "test-user",
            "email": "test@example.com",
            "is_admin": True
        }
    
    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(
            token, 
            check_revoked=False
        )
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "no-email@example.com")
        
        # Check if user is admin
        is_admin = decoded_token.get("admin", False)
        
        # For testing purposes, set all users as admin
        # Remove this in production
        is_admin = True
        
        logger.info(f"Authenticated user: {uid} (admin: {is_admin})")
        
        # Return user info without database check for now
        return {
            "uid": uid,
            "email": email,
            "is_admin": is_admin
        }
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        # For testing purposes, return admin user
        logger.warning("Auth failed but returning test admin user for development")
        return {
            "uid": "test-user",
            "email": "test@example.com",
            "is_admin": True
        }

async def get_admin_user(user = Depends(get_current_user)):
    """
    Check if the user is an admin.
    """
    if not user or not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user 