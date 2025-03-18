from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from .event import PyObjectId

class ProgressBase(BaseModel):
    """Base Progress model."""
    event_id: str
    user_id: str
    distance: Optional[float] = None  # in kilometers
    time: Optional[int] = None  # in minutes
    notes: Optional[str] = None

class ProgressCreate(ProgressBase):
    """Progress creation model."""
    pass

class ProgressUpdate(BaseModel):
    """Progress update model."""
    distance: Optional[float] = None
    time: Optional[int] = None
    notes: Optional[str] = None

class ProgressInDB(ProgressBase):
    """Progress model as stored in database."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str
        }

class Progress(ProgressInDB):
    """Progress model for API responses."""
    pass 