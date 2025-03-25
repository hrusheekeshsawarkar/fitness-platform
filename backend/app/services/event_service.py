from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.event import EventCreate, EventUpdate, Event, EventInDB

class EventService:
    """Service for event operations."""
    
    collection_name = "events"
    
    @classmethod
    async def create_event(cls, event: EventCreate) -> Event:
        """Create a new event."""
        db = await get_database()
        event_dict = event.dict()
        event_dict["created_at"] = datetime.utcnow()
        event_dict["participants"] = []
        
        result = await db[cls.collection_name].insert_one(event_dict)
        
        created_event = await db[cls.collection_name].find_one({"_id": result.inserted_id})
        return Event(**created_event)
    
    @classmethod
    async def get_event(cls, event_id: str) -> Optional[Event]:
        """Get an event by ID."""
        db = await get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        event = await db[cls.collection_name].find_one({"_id": ObjectId(event_id)})
        if event:
            return Event(**event)
        return None
    
    @classmethod
    async def get_events(cls, skip: int = 0, limit: int = 100) -> List[Event]:
        """Get all events with pagination."""
        db = await get_database()
        events = []
        cursor = db[cls.collection_name].find().skip(skip).limit(limit)
        async for event in cursor:
            events.append(Event(**event))
        return events
    
    @classmethod
    async def update_event(cls, event_id: str, event_update: EventUpdate) -> Optional[Event]:
        """Update an event."""
        db = await get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        # Filter out None values
        update_data = {k: v for k, v in event_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid update data provided")
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_event = await db[cls.collection_name].find_one({"_id": ObjectId(event_id)})
        return Event(**updated_event)
    
    @classmethod
    async def delete_event(cls, event_id: str) -> bool:
        """Delete an event."""
        db = await get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        result = await db[cls.collection_name].delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count > 0
    
    @classmethod
    async def register_participant(cls, event_id: str, user_id: str) -> Optional[Event]:
        """Register a participant for an event."""
        db = await get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        # Check if event exists
        event = await db[cls.collection_name].find_one({"_id": ObjectId(event_id)})
        if not event:
            return None
            
        # Check if user is already registered
        if user_id in event.get("participants", []):
            raise HTTPException(status_code=400, detail="User already registered for this event")
            
        # Add user to participants
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(event_id)},
            {"$addToSet": {"participants": user_id}}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_event = await db[cls.collection_name].find_one({"_id": ObjectId(event_id)})
        return Event(**updated_event)
    
    @classmethod
    async def unregister_participant(cls, event_id: str, user_id: str) -> Optional[Event]:
        """Unregister a participant from an event."""
        db = await get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        # Check if event exists
        event = await db[cls.collection_name].find_one({"_id": ObjectId(event_id)})
        if not event:
            return None
            
        # Remove user from participants
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(event_id)},
            {"$pull": {"participants": user_id}}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_event = await db[cls.collection_name].find_one({"_id": ObjectId(event_id)})
        return Event(**updated_event)
    
    @classmethod
    async def get_user_events(cls, user_id: str) -> List[Event]:
        """Get all events a user is registered for."""
        db = await get_database()
        events = []
        cursor = db[cls.collection_name].find({"participants": user_id})
        async for event in cursor:
            events.append(Event(**event))
        return events 