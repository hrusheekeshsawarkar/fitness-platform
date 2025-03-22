from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.firebase_auth import get_current_user, get_admin_user
from app.models.user import User, UserCreate, UserUpdate
from app.services.user_service import UserService

router = APIRouter()

@router.get("/check-email", status_code=status.HTTP_200_OK)
async def check_user_exists(
    email: str
):
    """
    Check if a user with the given email exists.
    """
    user = await UserService.get_user_by_email(email)
    return {"exists": user is not None}

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: UserCreate
):
    """
    Register a new user with detailed profile information.
    This endpoint is used during the registration process.
    """
    try:
        return await UserService.create_user(user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new user or get existing user.
    """
    # Set the Firebase UID from the authenticated user
    user.firebase_uid = current_user["uid"]
    user.email = current_user["email"]
    
    # Only admins can create admin users
    if user.is_admin and not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create admin users"
        )
    
    return await UserService.create_user(user)

@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current user's information.
    """
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        # For existing users that were created before the detailed registration,
        # We'll need to redirect them to complete their profile
        # Just create a minimal user record for now
        email = current_user.get("email", "")
        display_name = current_user.get("name", "")
        
        # Try to split display name into first and last name
        name_parts = display_name.split(" ", 1) if display_name else ["", ""]
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        try:
            new_user = UserCreate(
                firebase_uid=current_user["uid"],
                email=email,
                first_name=first_name,
                last_name=last_name,
                full_name=display_name,
                is_admin=current_user.get("is_admin", False),
                contact_number="",  # Empty as a placeholder
                age_category="",    # Empty as a placeholder
                city="",            # Empty as a placeholder
                state="",           # Empty as a placeholder
                country=""          # Empty as a placeholder
            )
            user = await UserService.create_user(new_user)
        except Exception as e:
            # If user creation fails, just return the error
            # so the frontend can prompt them to complete registration
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please complete your registration by providing additional details"
            )
    
    # If the user doesn't have all required profile fields filled out,
    # we should indicate they need to complete their profile
    if not user.first_name or not user.last_name or not user.contact_number or not user.age_category or not user.city or not user.state or not user.country:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="Please complete your profile with additional details"
        )
    
    return user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current user's information.
    """
    # Get the user from the database
    user = await UserService.get_user_by_firebase_uid(current_user["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only admins can update admin status
    if user_update.is_admin is not None and not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update admin status"
        )
    
    updated_user = await UserService.update_user(str(user.id), user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """
    Get a user by ID.
    Only admin users can access other users' information.
    """
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """
    Update a user.
    Only admin users can update other users.
    """
    updated_user = await UserService.update_user(user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """
    Delete a user.
    Only admin users can delete users.
    """
    deleted = await UserService.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}

@router.get("/", response_model=List[User])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_admin_user)
):
    """
    Get all users with pagination.
    Only admin users can access the list of users.
    """
    return await UserService.get_all_users(skip, limit) 