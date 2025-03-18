# Fitness Platform Backend

This is the backend for the Fitness Platform application, built with FastAPI and MongoDB.

## Features

- User authentication with Firebase
- Event management (create, update, delete)
- Participant registration for events
- Progress tracking
- Leaderboard generation

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up Firebase credentials:
   - Create a Firebase project
   - Download the service account key JSON file
   - Save it as `firebase-credentials.json` in the root directory or set the path in the .env file

5. Create a `.env` file with the following variables:
   ```
   MONGODB_URL=mongodb://danora:danora@34.44.230.187:27017/
   MONGODB_DB_NAME=fitness_platform
   SECRET_KEY=your-secret-key
   FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
   ```

6. Run the application:
   ```
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 