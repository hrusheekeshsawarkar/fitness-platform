import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
from ..core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get MongoDB connection URL from environment or use default
mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
mongodb_db_name = os.getenv("MONGODB_DB_NAME", settings.MONGODB_DB_NAME)

# Log connection settings
logger.info(f"MongoDB URL: {mongodb_url}")
logger.info(f"MongoDB DB Name: {mongodb_db_name}")

# Initialize MongoDB client
client = AsyncIOMotorClient(mongodb_url)
db = client[mongodb_db_name]

# Initialize collections
events_collection = db.events
participants_collection = db.participants
progress_collection = db.progress
photos_collection = db.photos

async def connect_to_mongodb():
    """Connect to MongoDB and verify connection."""
    global client, db
    try:
        # Verify the connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB successfully!")
        return db
    except ConnectionFailure as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {e}")
        raise

async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")

async def get_database():
    """Return database instance."""
    # We don't need to await anything here since client is already initialized
    return db 