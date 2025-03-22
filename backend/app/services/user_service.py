from datetime import datetime
import random
import string
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
        db = await get_database()
        
        # Check if user with this firebase_uid already exists
        existing_user = await db[cls.collection_name].find_one({"firebase_uid": user.firebase_uid})
        if existing_user:
            return User(**existing_user)
        
        # Check if user with this email already exists
        existing_email = await db[cls.collection_name].find_one({"email": user.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Set full_name based on first_name and last_name
        if not user.full_name and user.first_name and user.last_name:
            user_dict = user.dict()
            user_dict["full_name"] = f"{user.first_name} {user.last_name}"
        else:
            user_dict = user.dict()
        
        # Generate a unique 4-digit BIB number
        bib_number = await cls._generate_unique_bib_number()
        user_dict["bib_number"] = bib_number
        
        user_dict["created_at"] = datetime.utcnow()
        user_dict["registered_events"] = []
        
        result = await db[cls.collection_name].insert_one(user_dict)
        
        created_user = await db[cls.collection_name].find_one({"_id": result.inserted_id})
        return User(**created_user)
    
    @classmethod
    async def _generate_unique_bib_number(cls) -> str:
        """Generate a unique 4-digit BIB number."""
        db = await get_database()
        
        while True:
            # Generate a random 4-digit number
            bib_number = ''.join(random.choices(string.digits, k=4))
            
            # Check if this BIB number already exists
            existing_bib = await db[cls.collection_name].find_one({"bib_number": bib_number})
            if not existing_bib:
                return bib_number
    
    @classmethod
    async def get_user_by_email(cls, email: str) -> Optional[User]:
        """Get a user by email."""
        db = await get_database()
        user = await db[cls.collection_name].find_one({"email": email})
        if user:
            return User(**user)
        return None
    
    @classmethod
    async def get_user(cls, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        db = await get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await db[cls.collection_name].find_one({"_id": ObjectId(user_id)})
        if user:
            return User(**user)
        return None
    
    @classmethod
    async def get_user_by_firebase_uid(cls, firebase_uid: str) -> Optional[User]:
        """Get a user by Firebase UID."""
        db = await get_database()
        user = await db[cls.collection_name].find_one({"firebase_uid": firebase_uid})
        if user:
            return User(**user)
        return None
    
    @classmethod
    async def update_user(cls, user_id: str, user_update: UserUpdate) -> Optional[User]:
        """Update a user."""
        db = await get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        # Filter out None values
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid update data provided")
            
        update_data["updated_at"] = datetime.utcnow()
        
        # Update full_name if first_name or last_name is updated
        user = await cls.get_user(user_id)
        if user and ("first_name" in update_data or "last_name" in update_data):
            first_name = update_data.get("first_name", user.first_name)
            last_name = update_data.get("last_name", user.last_name)
            update_data["full_name"] = f"{first_name} {last_name}"
        
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
        db = await get_database()
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        result = await db[cls.collection_name].delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    @classmethod
    async def add_event_to_user(cls, user_id: str, event_id: str) -> Optional[User]:
        """Add an event to a user's registered events."""
        db = await get_database()
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
        db = await get_database()
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
        db = await get_database()
        users = []
        cursor = db[cls.collection_name].find().skip(skip).limit(limit)
        async for user in cursor:
            users.append(User(**user))
        return users 