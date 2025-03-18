import os
import firebase_admin
from firebase_admin import credentials, auth
import sys

def check_firebase_config():
    """Check if Firebase is properly configured."""
    try:
        # Check if credentials file exists
        cred_path = os.path.join(os.path.dirname(__file__), '..', '..', 'firebase-credentials.json')
        if not os.path.exists(cred_path):
            print(f"Error: Firebase credentials file not found at {cred_path}")
            print("Please download the service account key from Firebase Console:")
            print("1. Go to Firebase Console > Project Settings > Service Accounts")
            print("2. Click 'Generate New Private Key'")
            print("3. Save the file as 'firebase-credentials.json' in the backend directory")
            return False
        
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'projectId': os.getenv('FIREBASE_PROJECT_ID', 'personal-chat-cca45'),
            })
        
        # Try to list users (this will fail if credentials are invalid)
        page = auth.list_users()
        print("Firebase configuration is valid!")
        print(f"Found {len(page.users)} users in your Firebase project")
        
        return True
    except Exception as e:
        print(f"Error checking Firebase configuration: {str(e)}")
        return False

if __name__ == "__main__":
    check_firebase_config() 