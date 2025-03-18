from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.db.mongodb import connect_to_mongodb, close_mongodb_connection
import uvicorn

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Events for database connection
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongodb()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongodb_connection()

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Run2Rejuvenate API"}

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"} 

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
