from pymongo import MongoClient
from dotenv import dotenv_values
import os

env = dotenv_values(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
client = MongoClient(env['MONGODB_URI'])
db = client['trustbridge']

print("All users in DB:")
for u in db.users.find({}, {'email':1,'name':1,'role':1,'_id':0}):
    print(f"  {u}")

print(f"\nTotal users: {db.users.count_documents({})}")
client.close()
