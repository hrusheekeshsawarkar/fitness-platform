import os
import sys
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_firebase_credentials():
    """Verify Firebase credentials."""
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    project_id = os.getenv("FIREBASE_PROJECT_ID", "personal-chat-cca45")
    
    print(f"Looking for Firebase credentials at: {os.path.abspath(cred_path)}")
    
    if not os.path.exists(cred_path):
        print(f"Error: Firebase credentials file not found at {cred_path}")
        print("Please download the service account key from Firebase Console:")
        print("1. Go to Firebase Console > Project Settings > Service Accounts")
        print("2. Click 'Generate New Private Key'")
        print("3. Save the file as 'firebase-credentials.json' in the backend directory")
        return False
    
    try:
        print(f"Initializing Firebase with project ID: {project_id}")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'projectId': project_id,
        })
        
        # Try to list users to verify credentials
        print("Testing credentials by listing users...")
        page = auth.list_users()
        print("Firebase credentials are valid!")
        print(f"Found {len(page.users)} users in your Firebase project")
        return True
    except Exception as e:
        print(f"Error verifying Firebase credentials: {str(e)}")
        return False

if __name__ == "__main__":
    if verify_firebase_credentials():
        print("Firebase setup is correct!")
        sys.exit(0)
    else:
        print("Firebase setup failed. Please check the error messages above.")
        sys.exit(1) 