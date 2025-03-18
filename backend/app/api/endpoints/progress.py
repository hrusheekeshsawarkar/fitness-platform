from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.firebase_auth import get_current_user, get_admin_user
from app.models.progress import Progress, ProgressCreate, ProgressUpdate
from app.services.progress_service import ProgressService
from app.services.user_service import UserService

router = APIRouter()

@router.post("/", response_model=Progress, status_code=status.HTTP_201_CREATED)
async def create_progress(
    progress: ProgressCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new progress entry.
    """
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Set the user ID - always override with the authenticated user's ID
    progress.user_id = str(user.id)
    
    return await ProgressService.create_progress(progress)

@router.get("/", response_model=List[Progress])
async def get_user_progress(
    event_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all progress entries for the current user, optionally filtered by event.
    """
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return await ProgressService.get_user_progress(str(user.id), event_id)

@router.get("/{progress_id}", response_model=Progress)
async def get_progress(
    progress_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a progress entry by ID.
    """
    progress = await ProgressService.get_progress(progress_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if the progress entry belongs to the current user or if the user is an admin
    if str(progress.user_id) != str(user.id) and not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized to access this progress entry")
    
    return progress

@router.put("/{progress_id}", response_model=Progress)
async def update_progress(
    progress_id: str,
    progress_update: ProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a progress entry.
    """
    # Get the progress entry
    progress = await ProgressService.get_progress(progress_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if the progress entry belongs to the current user or if the user is an admin
    if str(progress.user_id) != str(user.id) and not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized to update this progress entry")
    
    updated_progress = await ProgressService.update_progress(progress_id, progress_update)
    if not updated_progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    return updated_progress

@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_progress(
    progress_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a progress entry.
    """
    # Get the progress entry
    progress = await ProgressService.get_progress(progress_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if the progress entry belongs to the current user or if the user is an admin
    if str(progress.user_id) != str(user.id) and not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized to delete this progress entry")
    
    deleted = await ProgressService.delete_progress(progress_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    return {"detail": "Progress entry deleted successfully"}

@router.get("/event/{event_id}", response_model=List[Progress])
async def get_event_progress(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all progress entries for an event.
    """
    return await ProgressService.get_event_progress(event_id)

@router.get("/event/{event_id}/leaderboard", response_model=List[Dict[str, Any]])
async def get_event_leaderboard(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get the leaderboard for an event.
    """
    return await ProgressService.get_leaderboard(event_id) 