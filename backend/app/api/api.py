from fastapi import APIRouter
from app.api.endpoints import users, events, progress

api_router = APIRouter()

# Include routers for different endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"]) 