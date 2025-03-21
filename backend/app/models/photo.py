from datetime import datetime
from typing import Optional, Annotated, Dict, Any
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

def validate_object_id(v: str) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return str(v)

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

class PhotoBase(BaseModel):
    """Base Photo model."""
    title: str
    description: Optional[str] = None
    image_url: str
    photo_date: datetime = Field(default_factory=datetime.utcnow)  # Date the photo was taken
    created_by: str  # admin user ID who uploaded it

class PhotoCreate(PhotoBase):
    """Photo creation model."""
    pass

class PhotoUpdate(BaseModel):
    """Photo update model."""
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    photo_date: Optional[datetime] = None

class PhotoInDB(PhotoBase):
    """Photo model as stored in database."""
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    # Aspect ratio info for frontend rendering
    width: Optional[int] = None
    height: Optional[int] = None
    
    model_config = {
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str
        }
    }

class Photo(BaseModel):
    """Photo model for API responses."""
    # Include all fields from PhotoBase
    title: str
    description: Optional[str] = None
    image_url: str
    photo_date: datetime
    created_by: str
    
    # Add ID and timestamps
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Optional fields
    width: Optional[int] = None
    height: Optional[int] = None
    
    # Additional fields added at runtime
    photo_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    
    model_config = {
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str
        },
        "extra": "allow"  # Allow extra fields
    } 