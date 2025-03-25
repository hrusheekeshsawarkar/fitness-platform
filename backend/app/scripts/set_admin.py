import firebase_admin
from firebase_admin import auth, credentials
import sys
import os

def set_admin_claim(user_email: str):
    """Set admin claim for a user by email."""
    try:
        # Initialize Firebase Admin SDK if not already initialized
        if not firebase_admin._apps:
            cred_path = os.path.join(os.path.dirname(__file__), '..', '..', 'firebase-credentials.json')
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        
        # Get user by email
        user = auth.get_user_by_email(user_email)
        
        # Set admin custom claim
        auth.set_custom_user_claims(user.uid, {'admin': True})
        
        print(f"Successfully set admin claim for user {user_email}")
        
        # Verify the claim was set
        updated_user = auth.get_user(user.uid)
        print(f"Updated user claims: {updated_user.custom_claims}")
        
    except Exception as e:
        print(f"Error setting admin claim: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python set_admin.py <user_email>")
        sys.exit(1)
    
    user_email = sys.argv[1]
    set_admin_claim(user_email) 