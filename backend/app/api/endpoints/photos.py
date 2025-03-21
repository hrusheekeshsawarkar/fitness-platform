from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
import logging
from app.core.firebase_auth import get_current_user, get_admin_user, get_optional_user
from app.models.photo import Photo, PhotoCreate, PhotoUpdate
from app.services.photo_service import PhotoService
from app.services.user_service import UserService
import aiofiles
import os
from datetime import datetime
import uuid
from app.core.config import settings
from PIL import Image as PILImage
import io

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads/photos"
# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=Photo)
async def create_photo(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    photo_date: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_optional_user)  # Changed to optional user for testing
):
    """
    Create a new photo.
    """
    try:
        # For testing, use a default user if no authenticated user
        if not current_user:
            logger.warning("No authenticated user - using test user for photo upload")
            current_user = {
                "uid": "test-user",
                "email": "test@example.com",
                "is_admin": True
            }
        else:
            # Check if user is admin - you can remove this check later if needed
            is_admin = current_user.get("is_admin", False)
            logger.info(f"User attempting to upload photo: {current_user.get('uid')} - Admin: {is_admin}")
        
        # Validate file type
        if not photo.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image",
            )
        
        # Generate unique filename
        file_ext = os.path.splitext(photo.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save the file
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Read the file content
        content = await photo.read()
        
        # Save original image
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)
        
        # Generate public URL for the file
        public_url = f"/uploads/photos/{unique_filename}"
        
        # Parse date if provided
        parsed_date = None
        if photo_date:
            try:
                parsed_date = datetime.fromisoformat(photo_date)
            except ValueError:
                parsed_date = datetime.utcnow()
        else:
            parsed_date = datetime.utcnow()
            
        # Create photo object
        photo_data = PhotoCreate(
            title=title,
            description=description,
            image_url=public_url,
            photo_date=parsed_date,
            created_by=current_user["uid"]
        )
        
        # Save to database
        created_photo = await PhotoService.create_photo(photo_data)
        
        # Add additional fields for the response
        base_url = str(request.base_url).rstrip("/")
        full_url = f"{base_url}{public_url}"
        
        # Ensure photo_url and thumbnail_url are set
        if not hasattr(created_photo, 'photo_url') or not created_photo.photo_url:
            created_photo.photo_url = full_url
            
        if not hasattr(created_photo, 'thumbnail_url') or not created_photo.thumbnail_url:
            created_photo.thumbnail_url = full_url
        
        logger.info(f"Successfully created photo with ID: {created_photo.id}")
        return created_photo
            
    except Exception as e:
        logger.error(f"Error saving photo: {str(e)}")
        # Check if file was saved but database failed
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                # If file was saved but database operation failed, delete the file
                os.remove(file_path)
                logger.info(f"Cleaned up file after error: {file_path}")
            except Exception as cleanup_err:
                logger.error(f"Failed to clean up file after error: {str(cleanup_err)}")
                
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save photo: {str(e)}",
        )

@router.get("/", response_model=Dict)
async def get_photos(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = Query("-created_at", description="Sort field, prefix with - for descending: -created_at, photo_date, title")
):
    """
    Get a list of photos with pagination.
    """
    photos = await PhotoService.get_photos(skip, limit, sort_by)
    total = await PhotoService.count_photos()
    
    # Map image URLs to include backend URL if needed
    base_url = str(request.base_url)
    for photo in photos:
        # Make sure we have the full URL for images
        if not photo.image_url.startswith(("http://", "https://")):
            # Add base URL for relative paths
            photo_url = f"{base_url}{photo.image_url.lstrip('/')}"
            # Set the photo_url and thumbnail_url fields that frontend expects
            photo.photo_url = photo_url
            photo.thumbnail_url = photo_url
    
    return {
        "items": photos,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.get("/count")
async def get_photo_count():
    """
    Get the total number of photos.
    """
    count = await PhotoService.count_photos()
    return {"count": count}

@router.get("/{photo_id}", response_model=Photo)
async def get_photo(
    request: Request,
    photo_id: str
):
    """
    Get a specific photo by ID.
    """
    photo = await PhotoService.get_photo(photo_id)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )
        
    # Add the full URL for the image
    if not photo.image_url.startswith(("http://", "https://")):
        base_url = str(request.base_url)
        photo.photo_url = f"{base_url}{photo.image_url.lstrip('/')}"
        photo.thumbnail_url = photo.photo_url
        
    return photo

@router.put("/{photo_id}", response_model=Photo)
async def update_photo(
    photo_id: str,
    photo_data: PhotoUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """
    Update a photo - Admin only.
    """
    photo = await PhotoService.update_photo(photo_id, photo_data)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )
    return photo

@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: str,
    current_user: dict = Depends(get_optional_user)  # Changed to optional user for easier testing
):
    """
    Delete a photo - Admin only.
    """
    try:
        # Verify user is admin
        if not current_user or not current_user.get("is_admin", False):
            logger.warning(f"Non-admin user attempted to delete photo: {current_user}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin users can delete photos",
            )
            
        logger.info(f"Admin user {current_user.get('uid')} attempting to delete photo {photo_id}")
            
        # First get the photo to get its file path
        photo = await PhotoService.get_photo(photo_id)
        if not photo:
            logger.warning(f"Photo not found: {photo_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found",
            )
        
        logger.info(f"Found photo to delete: {photo}")
        # Store image_url before deleting from database
        image_url = photo.image_url
        logger.info(f"Photo image_url: {image_url}")
        
        # Delete from database
        success = await PhotoService.delete_photo(photo_id)
        if not success:
            logger.warning(f"Failed to delete photo from database: {photo_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found or could not be deleted from database",
            )
        
        # Delete the actual file
        try:
            # Extract file path
            if not image_url:
                logger.warning("No image URL found for photo")
                return JSONResponse(content={"detail": "Photo deleted from database but no image URL found"})
            
            # Try multiple path variations to handle different URL formats
            possible_paths = []
            
            # Handle full URLs with domain
            if "://" in image_url:
                from urllib.parse import urlparse
                parsed_url = urlparse(image_url)
                path = parsed_url.path
                if path.startswith('/'):
                    path = path[1:]  # Remove leading slash
                possible_paths.append(path)
                
            # Handle paths with or without leading slash
            if image_url.startswith('/'):
                possible_paths.append(image_url[1:])  # Without leading slash
            else:
                possible_paths.append(image_url)
                possible_paths.append(f"/{image_url}")  # With leading slash
                
            # Try relative to uploads dir
            if "uploads/photos" in image_url:
                filename = os.path.basename(image_url)
                possible_paths.append(f"uploads/photos/{filename}")
                
            # Attempt to delete using all possible paths
            deleted = False
            for path in possible_paths:
                logger.info(f"Attempting to delete file: {path}")
                if os.path.exists(path):
                    os.remove(path)
                    logger.info(f"Successfully deleted file: {path}")
                    deleted = True
                    break
                    
            if not deleted:
                paths_str = ", ".join(possible_paths)
                logger.warning(f"File not found for deletion. Tried paths: {paths_str}")
                
        except Exception as e:
            logger.error(f"Error deleting photo file: {str(e)}")
            # We don't want to fail the request if DB deletion was successful
            # Just log the error
        
        return JSONResponse(content={"detail": "Photo deleted successfully"})
    except Exception as e:
        logger.error(f"Error in delete_photo endpoint: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete photo: {str(e)}"
        ) 