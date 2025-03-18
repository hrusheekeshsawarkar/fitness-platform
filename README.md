# Fitness Platform

A comprehensive fitness events platform that enables users to participate in fitness challenges and events.

## Features

- **Event Management**: Create, browse, and join fitness events
- **Progress Tracking**: Track your progress in events you've joined
- **Leaderboards**: See how you rank against other participants
- **User Authentication**: Secure login with Firebase
- **Admin Dashboard**: Manage events and users (for administrators)

## Tech Stack

### Backend
- FastAPI
- MongoDB
- Firebase Authentication

### Frontend
- Next.js 14
- Shadcn UI
- Firebase Authentication

## Setup

### Backend
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install requirements:
   ```
   pip install -r requirements.txt
   ```
3. Set up Firebase credentials JSON file
4. Start the server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Firebase configuration in `.env.local`
4. Start the development server:
   ```
   npm run dev
   ```

## License

MIT 