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
    # Import here to avoid circular import
    from app.models.user import UserCreate
    from app.services.user_service import UserService
    
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
        email = decoded_token.get("email", "no-email@example.com")
        
        # Check if user is admin (you can customize this based on your needs)
        # For example, you might have a custom claim in Firebase for admin users
        is_admin = decoded_token.get("admin", False)
        
        # Ensure the user exists in our database
        user_db = await UserService.get_user_by_firebase_uid(uid)
        if not user_db:
            # If user doesn't exist, create them
            new_user = UserCreate(
                firebase_uid=uid,
                email=email,
                full_name=decoded_token.get("name", None),
                is_admin=is_admin
            )
            try:
                user_db = await UserService.create_user(new_user)
                logger.info(f"Created new user in database for UID: {uid}")
            except Exception as e:
                logger.error(f"Error creating user in database: {str(e)}")
                # Even if we can't create the user, we still want to allow authentication
        
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
    # Import here to avoid circular import
    from app.models.user import UserCreate
    from app.services.user_service import UserService
    
    if not credentials:
        return None
    
    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "no-email@example.com")
        
        # Check if user is admin
        is_admin = decoded_token.get("admin", False)
        
        # Ensure the user exists in our database
        user_db = await UserService.get_user_by_firebase_uid(uid)
        if not user_db:
            # If user doesn't exist, create them
            new_user = UserCreate(
                firebase_uid=uid,
                email=email,
                full_name=decoded_token.get("name", None),
                is_admin=is_admin
            )
            try:
                user_db = await UserService.create_user(new_user)
                logger.info(f"Created new user in database for UID: {uid}")
            except Exception as e:
                logger.error(f"Error creating user in database: {str(e)}")
                # Even if we can't create the user, we still want to allow authentication
        
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