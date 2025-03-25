from fastapi import APIRouter, HTTPException, Depends, Body, Query, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from pymongo.collection import Collection

from app.db.mongodb import get_database
from app.core.firebase_auth import get_current_user

router = APIRouter()

# Helper function to extract display name from user data
def get_display_name(user_data: Dict[str, Any]) -> str:
    """
    Extract a display name from user data.
    Returns a formatted display name, prioritizing displayName, then email username.
    """
    display_name = user_data.get("displayName")
    if not display_name:
        email = user_data.get("email", "")
        # Try to get the username part of the email as display name
        if "@" in email:
            display_name = email.split("@")[0]
            # Capitalize the first letter of each word to make it look like a name
            display_name = " ".join(word.capitalize() for word in display_name.split("."))
        else:
            display_name = "Anonymous"
    return display_name

class ArticleBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    category: str  # "food-nutrition", "posture-breathing", "injuries-gear", "performance"
    content: str  # Rich text content (HTML)
    
class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None

class Article(ArticleBase):
    id: str
    author: str
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

def serialize_article(article):
    return {
        "id": str(article["_id"]),
        "title": article["title"],
        "subtitle": article.get("subtitle"),
        "category": article["category"],
        "content": article["content"],
        "author": article["author"],
        "author_name": article.get("author_name"),
        "created_at": article["created_at"],
        "updated_at": article.get("updated_at")
    }

@router.get("/", response_model=List[Article])
async def get_articles(
    category: Optional[str] = None,
    db = Depends(get_database)
):
    query = {}
    if category:
        query["category"] = category
    
    articles_collection: Collection = db.articles
    cursor = articles_collection.find(query).sort("created_at", -1)
    articles = await cursor.to_list(length=100)  # Limit to 100 articles for performance
    return [serialize_article(article) for article in articles]

@router.get("/{article_id}", response_model=Article)
async def get_article(
    article_id: str,
    db = Depends(get_database)
):
    articles_collection: Collection = db.articles
    article = await articles_collection.find_one({"_id": ObjectId(article_id)})
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    return serialize_article(article)

@router.post("/", response_model=Article, status_code=status.HTTP_201_CREATED)
async def create_article(
    article: ArticleCreate,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    # Ensure user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create articles"
        )
    
    articles_collection: Collection = db.articles
    
    # Extract a display name from the email if needed
    display_name = get_display_name(current_user)
    
    new_article = {
        "title": article.title,
        "subtitle": article.subtitle,
        "category": article.category,
        "content": article.content,
        "author": current_user["uid"],
        "author_name": display_name,
        "created_at": datetime.utcnow()
    }
    
    result = await articles_collection.insert_one(new_article)
    created_article = await articles_collection.find_one({"_id": result.inserted_id})
    
    return serialize_article(created_article)

@router.put("/{article_id}", response_model=Article)
async def update_article(
    article_id: str,
    article_update: ArticleUpdate,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    # Ensure user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update articles"
        )
    
    articles_collection: Collection = db.articles
    existing_article = await articles_collection.find_one({"_id": ObjectId(article_id)})
    
    if not existing_article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in article_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Ensure that if the editor is not the original author, we don't update the author fields
    if existing_article["author"] != current_user["uid"]:
        # This is an edit by someone other than the original author
        # We'll just update the content, not the author attribution
        pass
    else:
        # This is the original author, update the author_name in case it's changed
        # Extract a display name from the email if needed
        display_name = get_display_name(current_user)
        
        update_data["author_name"] = display_name
    
    await articles_collection.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": update_data}
    )
    
    updated_article = await articles_collection.find_one({"_id": ObjectId(article_id)})
    return serialize_article(updated_article)

@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    # Ensure user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete articles"
        )
    
    articles_collection: Collection = db.articles
    result = await articles_collection.delete_one({"_id": ObjectId(article_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found") 