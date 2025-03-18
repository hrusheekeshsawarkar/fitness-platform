from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.user import UserCreate, UserUpdate, User

class UserService:
    """Service for user operations."""
    
    collection_name = "users"
    
    @classmethod
    async def create_user(cls, user: UserCreate) -> User:
        """Create a new user."""
        db = get_database()
        
        # Check if user with this firebase_uid already exists
        existing_user = await db[cls.collection_name].find_one({"firebase_uid": user.firebase_uid})
        if existing_user:
            return User(**existing_user)
        
        user_dict = user.dict()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["registered_events"] = []
        
        result = await db[cls.collection_name].insert_one(user_dict)
        
        created_user = await db[cls.collection_name].find_one({"_id": result.inserted_id})
        return User(**created_user)
    
    @classmethod
    async def get_user(cls, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        db = get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await db[cls.collection_name].find_one({"_id": ObjectId(user_id)})
        if user:
            return User(**user)
        return None
    
    @classmethod
    async def get_user_by_firebase_uid(cls, firebase_uid: str) -> Optional[User]:
        """Get a user by Firebase UID."""
        db = get_database()
        user = await db[cls.collection_name].find_one({"firebase_uid": firebase_uid})
        if user:
            return User(**user)
        return None
    
    @classmethod
    async def update_user(cls, user_id: str, user_update: UserUpdate) -> Optional[User]:
        """Update a user."""
        db = get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        # Filter out None values
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid update data provided")
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_user = await db[cls.collection_name].find_one({"_id": ObjectId(user_id)})
        return User(**updated_user)
    
    @classmethod
    async def delete_user(cls, user_id: str) -> bool:
        """Delete a user."""
        db = get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        result = await db[cls.collection_name].delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    @classmethod
    async def add_event_to_user(cls, user_id: str, event_id: str) -> Optional[User]:
        """Add an event to a user's registered events."""
        db = get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"registered_events": event_id}}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_user = await db[cls.collection_name].find_one({"_id": ObjectId(user_id)})
        return User(**updated_user)
    
    @classmethod
    async def remove_event_from_user(cls, user_id: str, event_id: str) -> Optional[User]:
        """Remove an event from a user's registered events."""
        db = get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        if not ObjectId.is_valid(event_id):
            raise HTTPException(status_code=400, detail="Invalid event ID format")
            
        result = await db[cls.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"registered_events": event_id}}
        )
        
        if result.modified_count == 0:
            return None
            
        updated_user = await db[cls.collection_name].find_one({"_id": ObjectId(user_id)})
        return User(**updated_user)
    
    @classmethod
    async def get_all_users(cls, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        db = get_database()
        users = []
        cursor = db[cls.collection_name].find().skip(skip).limit(limit)
        async for user in cursor:
            users.append(User(**user))
        return users 