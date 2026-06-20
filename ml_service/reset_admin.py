"""Reset admin password to Admin@123 (meets 8-char + letters + numbers requirement)"""
import bcrypt
from pymongo import MongoClient
from dotenv import dotenv_values
import os

env = dotenv_values(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
client = MongoClient(env['MONGODB_URI'])
db = client['trustbridge']

new_password = "Admin@123"
hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(12)).decode()

result = db.users.update_one(
    {"email": "admin@trustbridge.com"},
    {"$set": {"password": hashed}}
)
print(f"Admin password updated: {result.modified_count} document(s) modified")
print(f"Login: admin@trustbridge.com / Admin@123")
client.close()
