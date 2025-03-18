import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
from ..core.config import settings

# Load environment variables
load_dotenv()

# MongoDB client instance
client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
db = client[settings.MONGODB_DB_NAME]

# Collections
events_collection = db.events
participants_collection = db.participants
progress_collection = db.progress

async def connect_to_mongodb():
    """Connect to MongoDB."""
    global client, db
    try:
        # Verify the connection
        await client.admin.command('ping')
        print("Connected to MongoDB successfully!")
        
        return db
    except ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        raise

async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_database():
    """Return database instance."""
    return db 