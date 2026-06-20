"""
Debug script — check what reviews exist in MongoDB for the problematic services.
Run: python check_reviews.py
"""
import os, sys
from pymongo import MongoClient
from dotenv import dotenv_values

env_path = os.path.join(os.path.dirname(__file__), '..', 'server', '.env')
env = dotenv_values(env_path)
uri = env.get('MONGODB_URI', '')

if not uri:
    print("ERROR: MONGODB_URI not found in server/.env")
    sys.exit(1)

client = MongoClient(uri)
db = client['trustbridge']

user_id   = '6a313bb3cde157532e0818c4'
service_ids = [
    '6a2f022b5336755f323cc429',
    '6a2f022b5336755f323cc42e',
    '6a2f022b5336755f323cc430',
]

from bson import ObjectId

print(f"\nChecking reviews for userId: {user_id}\n")
for sid in service_ids:
    reviews = list(db.reviews.find(
        { 'service': ObjectId(sid), 'user': ObjectId(user_id) },
        { 'status': 1, 'content': 1, 'createdAt': 1 }
    ))
    print(f"Service {sid}: {len(reviews)} review(s)")
    for r in reviews:
        print(f"  → _id={r['_id']}  status={r.get('status')}  content={str(r.get('content',''))[:60]}")
    print()

client.close()
