from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

def validate_object_id(v: str) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return str(v)

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

class EventType(str):
    """Event types enum."""
    RUNNING = "running"
    CYCLING = "cycling"
    WALKING = "walking"
    SWIMMING = "swimming"
    OTHER = "other"

class EventBase(BaseModel):
    """Base Event model."""
    name: str
    description: str
    event_type: str
    start_date: datetime
    end_date: datetime
    target_distance: Optional[float] = None  # in kilometers
    target_time: Optional[int] = None  # in minutes
    created_by: str  # admin user ID

class EventCreate(EventBase):
    """Event creation model."""
    pass

class EventUpdate(BaseModel):
    """Event update model."""
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_distance: Optional[float] = None
    target_time: Optional[int] = None

class EventInDB(EventBase):
    """Event model as stored in database."""
    id: PyObjectId = Field(alias="_id")
    participants: List[str] = []  # List of participant user IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    model_config = {
        "allow_population_by_field_name": True,
        "json_encoders": {
            ObjectId: str
        }
    }

class Event(EventInDB):
    """Event model for API responses."""
    pass 