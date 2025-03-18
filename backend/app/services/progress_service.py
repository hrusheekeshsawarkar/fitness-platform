from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.progress import ProgressCreate, ProgressUpdate, Progress
from app.services.event_service import EventService

class ProgressService:
    """Service for progress operations."""
    
    collection_name = "progress"
    
    @classmethod
    async def create_progress(cls, progress: ProgressCreate) -> Progress:
        """Create a new progress entry."""
        db = get_database()
        
        # Check if event exists
        event = await EventService.get_event(progress.event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is registered for the event
        if progress.user_id not in event.participants:
            raise HTTPException(status_code=400, detail="User is not registered for this event")
        
        progress_dict = progress.dict()
        progress_dict["created_at"] = datetime.utcnow()
        
        result = await db[cls.collection_name].insert_one(progress_dict)
        
        created_progress = await db[cls.collection_name].find_one({"_id": result.inserted_id})
        return Progress(**created_progress)
    
    @classmethod
    async def get_progress(cls, progress_id: str) -> Optional[Progress]:
        """Get a progress entry by ID."""
        db = get_database()
        if not ObjectId.is_valid(progress_id):
            raise HTTPException(status_code=400, detail="Invalid progress ID format")
            
        progress = await db[cls.collection_name].find_one({"_id": ObjectId(progress_id)})
        if progress:
            return Progress(**progress)
        return None
    
    @classmethod
    async def update_progress(cls, progress_id: str, progress_update: ProgressUpdate) -> Optional[Progress]:
        """Update a progress entry."""
        db = get_database()
        if not ObjectId.is_valid(progress_id):
            raise HTTPException(status_code=400, detail="Invalid progress ID format")
            
        # Filter out None values
        update_data = {k: v for k, v in progress_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid update data provided")
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(progress_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_progress = await db[cls.collection_name].find_one({"_id": ObjectId(progress_id)})
        return Progress(**updated_progress)
    
    @classmethod
    async def delete_progress(cls, progress_id: str) -> bool:
        """Delete a progress entry."""
        db = get_database()
        if not ObjectId.is_valid(progress_id):
            raise HTTPException(status_code=400, detail="Invalid progress ID format")
            
        result = await db[cls.collection_name].delete_one({"_id": ObjectId(progress_id)})
        return result.deleted_count > 0
    
    @classmethod
    async def get_user_progress(cls, user_id: str, event_id: Optional[str] = None) -> List[Progress]:
        """Get all progress entries for a user, optionally filtered by event."""
        db = get_database()
        query = {"user_id": user_id}
        
        if event_id:
            if not ObjectId.is_valid(event_id):
                raise HTTPException(status_code=400, detail="Invalid event ID format")
            query["event_id"] = event_id
            
        progress_entries = []
        cursor = db[cls.collection_name].find(query)
        async for progress in cursor:
            progress_entries.append(Progress(**progress))
        return progress_entries
    
    @classmethod
    async def get_event_progress(cls, event_id: str) -> List[Progress]:
        """Get all progress entries for an event."""
        db = get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        progress_entries = []
        cursor = db[cls.collection_name].find({"event_id": event_id})
        async for progress in cursor:
            progress_entries.append(Progress(**progress))
        return progress_entries
    
    @classmethod
    async def get_leaderboard(cls, event_id: str) -> List[Dict[str, Any]]:
        """Get leaderboard for an event."""
        db = get_database()
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        # Get event to determine the type (distance or time based)
        event = await EventService.get_event(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # Aggregate progress by user
        pipeline = [
            {"$match": {"event_id": event_id}},
            {"$group": {
                "_id": "$user_id",
                "total_distance": {"$sum": "$distance"},
                "total_time": {"$sum": "$time"},
                "last_update": {"$max": "$created_at"}
            }},
        ]
        
        # Sort based on event type
        if event.target_distance:
            pipeline.append({"$sort": {"total_distance": -1, "last_update": 1}})
        else:
            pipeline.append({"$sort": {"total_time": -1, "last_update": 1}})
            
        leaderboard = []
        cursor = db[cls.collection_name].aggregate(pipeline)
        rank = 1
        
        async for entry in cursor:
            leaderboard.append({
                "rank": rank,
                "user_id": entry["_id"],
                "total_distance": entry.get("total_distance", 0),
                "total_time": entry.get("total_time", 0),
                "last_update": entry["last_update"]
            })
            rank += 1
            
        return leaderboard 