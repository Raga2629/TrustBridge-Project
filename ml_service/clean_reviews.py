"""
Clean up stale/incorrectly-approved test reviews from MongoDB.
- Deletes reviews with status: suspicious, pending_review, pending_verification, flagged, blocked
- Deletes the specific promotional review that was incorrectly approved before the ML fix
Run: python clean_reviews.py
"""
import os, sys
from pymongo import MongoClient
from bson import ObjectId
from dotenv import dotenv_values

env_path = os.path.join(os.path.dirname(__file__), '..', 'server', '.env')
env = dotenv_values(env_path)
uri = env.get('MONGODB_URI', '')

if not uri:
    print("ERROR: MONGODB_URI not found in server/.env")
    sys.exit(1)

client = MongoClient(uri)
db = client['trustbridge']

# 1. Delete all non-binary-status reviews (legacy stale statuses)
stale_statuses = ['suspicious', 'pending_review', 'pending_verification', 'flagged', 'blocked']
result1 = db.reviews.delete_many({ 'status': { '$in': stale_statuses } })
print(f"Deleted {result1.deleted_count} stale-status reviews ({', '.join(stale_statuses)})")

# 2. Delete the specific promotional review that was incorrectly approved
# (the "best restaurant in Hyderabad" review — approved before the ML fix)
promotional_id = '6a3182e8245e99040df50e96'
result2 = db.reviews.delete_one({ '_id': ObjectId(promotional_id) })
print(f"Deleted promotional review (was incorrectly approved): {result2.deleted_count} removed")

# 3. Show what remains
print("\nRemaining reviews per service:")
pipeline = [
    { '$group': { '_id': { 'service': '$service', 'status': '$status' }, 'count': { '$sum': 1 } } },
    { '$sort': { '_id.service': 1 } }
]
for doc in db.reviews.aggregate(pipeline):
    print(f"  service={doc['_id']['service']}  status={doc['_id']['status']}  count={doc['count']}")

client.close()
print("\nDone. Stale reviews cleaned.")
