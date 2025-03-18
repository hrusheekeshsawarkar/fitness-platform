from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from .event import PyObjectId

class UserBase(BaseModel):
    """Base User model."""
    email: EmailStr
    full_name: Optional[str] = None
    firebase_uid: str
    is_admin: bool = False

class UserCreate(UserBase):
    """User creation model."""
    pass

class UserUpdate(BaseModel):
    """User update model."""
    full_name: Optional[str] = None
    is_admin: Optional[bool] = None

class UserInDB(UserBase):
    """User model as stored in database."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    registered_events: List[str] = []  # List of event IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str
        }

class User(UserInDB):
    """User model for API responses."""
    pass 