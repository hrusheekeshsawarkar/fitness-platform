from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from .event import PyObjectId

class UserBase(BaseModel):
    """Base User model."""
    email: EmailStr
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    firebase_uid: str
    is_admin: bool = False
    contact_number: str
    age_category: str  # below 18, 18-35, 36-50, 50-60, above 60
    city: str
    state: str
    country: str
    bib_number: Optional[str] = None  # 4-digit unique identifier

class UserCreate(UserBase):
    """User creation model."""
    pass

class UserUpdate(BaseModel):
    """User update model."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    is_admin: Optional[bool] = None
    contact_number: Optional[str] = None
    age_category: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

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