from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId
from fastapi import HTTPException, status
import logging
from app.db.mongodb import get_database, photos_collection
from app.models.photo import PhotoCreate, PhotoUpdate, Photo, PhotoInDB

logger = logging.getLogger(__name__)

class PhotoService:
    """Service for photo operations."""
    
    collection_name = "photos"
    
    @staticmethod
    async def create_photo(photo_data: PhotoCreate) -> Photo:
        """Create a new photo."""
        try:
            # Get database directly
            db = await get_database()
            
            # Generate a new ObjectId
            obj_id = ObjectId()
            current_time = datetime.utcnow()
            
            # Create the photo document for the database
            photo_db = PhotoInDB(
                **photo_data.model_dump(),
                _id=obj_id,
                created_at=current_time,
            )
            
            # Convert model to dict for MongoDB
            photo_dict = photo_db.model_dump(by_alias=True)
            
            # Insert into MongoDB
            collection = db[PhotoService.collection_name]
            result = await collection.insert_one(photo_dict)
            
            if not result.acknowledged:
                logger.error("MongoDB failed to acknowledge insert operation")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create photo - database error",
                )
            
            logger.info(f"Photo created with ID: {result.inserted_id}")
            
            # Create a Photo model for the API response
            return Photo(
                _id=str(obj_id),
                title=photo_data.title,
                description=photo_data.description,
                image_url=photo_data.image_url,
                photo_date=photo_data.photo_date,
                created_by=photo_data.created_by,
                created_at=current_time,
                photo_url=photo_data.image_url,
                thumbnail_url=photo_data.image_url
            )
            
        except Exception as e:
            logger.error(f"Error in create_photo: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create photo: {str(e)}",
            )
    
    @staticmethod
    async def get_photos(skip: int = 0, limit: int = 10, sort_by: str = "-created_at") -> List[Photo]:
        """
        Get a list of photos with pagination.
        Sort by: -created_at (newest first), photo_date, title
        """
        try:
            db = await get_database()
            
            # Determine sort order
            sort_order = 1
            if sort_by.startswith("-"):
                sort_order = -1
                sort_by = sort_by[1:]
                
            collection = db[PhotoService.collection_name]
            cursor = collection.find().sort(
                sort_by, sort_order
            ).skip(skip).limit(limit)
            
            photos = []
            async for doc in cursor:
                photos.append(Photo(**doc))
                
            return photos
        except Exception as e:
            logger.error(f"Error in get_photos: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve photos: {str(e)}",
            )
    
    @staticmethod
    async def get_photo(photo_id: str) -> Optional[Photo]:
        """Get a photo by ID."""
        try:
            logger.info(f"Looking for photo with ID: {photo_id}")
            
            # Check if photo_id is a valid ObjectId
            if not ObjectId.is_valid(photo_id):
                logger.warning(f"Invalid ObjectId format: {photo_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid photo ID format",
                )
                
            db = await get_database()
            collection = db[PhotoService.collection_name]
            
            # Try to find with ObjectId
            obj_id = ObjectId(photo_id)
            logger.info(f"Searching with ObjectId: {obj_id}")
            photo_data = await collection.find_one({"_id": obj_id})
            
            if not photo_data:
                logger.warning(f"No photo found with ID: {photo_id}")
                # Try to find with string ID as fallback
                photo_data = await collection.find_one({"_id": photo_id})
                
            if not photo_data:
                logger.warning(f"No photo found with ID (second attempt): {photo_id}")
                return None
                
            logger.info(f"Found photo: {photo_data}")
            return Photo(**photo_data)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Error in get_photo: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve photo: {str(e)}",
            )
    
    @staticmethod
    async def update_photo(photo_id: str, photo_data: PhotoUpdate) -> Optional[Photo]:
        """Update a photo."""
        try:
            if not ObjectId.is_valid(photo_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid photo ID",
                )
                
            db = await get_database()
            collection = db[PhotoService.collection_name]
            
            # Filter out None values
            update_data = {k: v for k, v in photo_data.model_dump().items() if v is not None}
            
            if not update_data:
                # No fields to update
                return await PhotoService.get_photo(photo_id)
                
            # Add updated_at timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            result = await collection.update_one(
                {"_id": ObjectId(photo_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return None
                
            return await PhotoService.get_photo(photo_id)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Error in update_photo: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update photo: {str(e)}",
            )
    
    @staticmethod
    async def delete_photo(photo_id: str) -> bool:
        """Delete a photo."""
        try:
            logger.info(f"Attempting to delete photo with ID: {photo_id}")
            
            # Check if photo_id is a valid ObjectId
            if not ObjectId.is_valid(photo_id):
                logger.warning(f"Invalid ObjectId format: {photo_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid photo ID format",
                )
                
            db = await get_database()
            collection = db[PhotoService.collection_name]
            
            # Try to delete with ObjectId
            obj_id = ObjectId(photo_id)
            logger.info(f"Deleting with ObjectId: {obj_id}")
            result = await collection.delete_one({"_id": obj_id})
            
            if result.deleted_count == 0:
                logger.warning(f"No photo deleted with ID: {photo_id}")
                # Try with string ID as fallback
                result = await collection.delete_one({"_id": photo_id})
                
            deleted = result.deleted_count > 0
            logger.info(f"Photo deletion result: {deleted} (deleted_count: {result.deleted_count})")
            return deleted
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Error in delete_photo: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete photo: {str(e)}",
            )
    
    @staticmethod
    async def count_photos() -> int:
        """Get the total count of photos."""
        try:
            db = await get_database()
            collection = db[PhotoService.collection_name]
            return await collection.count_documents({})
        except Exception as e:
            logger.error(f"Error in count_photos: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to count photos: {str(e)}",
            ) 