from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.firebase_auth import get_current_user, get_admin_user, get_optional_user
from app.models.event import Event, EventCreate, EventUpdate
from app.services.event_service import EventService
from app.services.user_service import UserService
from bson import ObjectId
import logging
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.mongodb import events_collection

router = APIRouter()
logger = logging.getLogger(__name__)

# Public endpoint for listing events - optional authentication
@router.get("/", response_model=List[Event])
async def get_events(user = Depends(get_optional_user)):
    """Get all events. This endpoint is public and doesn't require authentication."""
    try:
        events = await events_collection.find().to_list(1000)
        return events
    except Exception as e:
        logger.error(f"Error fetching events: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching events: {str(e)}"
        )

@router.post("/", response_model=Event)
async def create_event(event: EventCreate, user = Depends(get_admin_user)):
    """Create a new event. Only admin users can create events."""
    try:
        event_dict = event.dict()
        event_dict["created_by"] = user["uid"]
        event_dict["participants"] = []
        
        result = await events_collection.insert_one(event_dict)
        
        created_event = await events_collection.find_one({"_id": result.inserted_id})
        return created_event
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating event: {str(e)}"
        )

@router.get("/{event_id}", response_model=Event)
async def get_event(event_id: str, user = Depends(get_optional_user)):
    """Get a specific event by ID. This endpoint is public."""
    try:
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
        
        event = await events_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return event
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching event: {str(e)}"
        )

@router.put("/{event_id}", response_model=Event)
async def update_event(event_id: str, event_update: EventUpdate, user = Depends(get_admin_user)):
    """Update an event. Only admin users can update events."""
    try:
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
        
        event = await events_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        update_data = {k: v for k, v in event_update.dict(exclude_unset=True).items() if v is not None}
        
        if update_data:
            await events_collection.update_one(
                {"_id": ObjectId(event_id)},
                {"$set": update_data}
            )
        
        updated_event = await events_collection.find_one({"_id": ObjectId(event_id)})
        return updated_event
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating event: {str(e)}"
        )

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: str, user = Depends(get_admin_user)):
    """Delete an event. Only admin users can delete events."""
    try:
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
        
        event = await events_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        await events_collection.delete_one({"_id": ObjectId(event_id)})
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting event: {str(e)}"
        )

@router.post("/{event_id}/register", status_code=status.HTTP_200_OK)
async def register_for_event(event_id: str, user = Depends(get_current_user)):
    """Register the current user for an event."""
    try:
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
        
        event = await events_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is already registered
        if user["uid"] in event.get("participants", []):
            raise HTTPException(status_code=400, detail="User is already registered for this event")
        
        # Add user to participants
        await events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$addToSet": {"participants": user["uid"]}}
        )
        
        return {"message": "Successfully registered for event"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering for event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering for event: {str(e)}"
        )

@router.post("/{event_id}/unregister", status_code=status.HTTP_200_OK)
async def unregister_from_event(event_id: str, user = Depends(get_current_user)):
    """Unregister the current user from an event."""
    try:
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
        
        event = await events_collection.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is registered
        if user["uid"] not in event.get("participants", []):
            raise HTTPException(status_code=400, detail="User is not registered for this event")
        
        # Remove user from participants
        await events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$pull": {"participants": user["uid"]}}
        )
        
        return {"message": "Successfully unregistered from event"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unregistering from event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error unregistering from event: {str(e)}"
        )

@router.get("/user/registered", response_model=List[Event])
async def get_user_registered_events(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all events the current user is registered for.
    """
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return await EventService.get_user_events(str(user.id)) 