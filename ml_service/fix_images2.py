"""
Fix service images with unique, verified Unsplash photo IDs per service.
Every service gets a completely different image.
"""
from pymongo import MongoClient
from dotenv import dotenv_values
import os

env = dotenv_values(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
client = MongoClient(env['MONGODB_URI'])
db = client['trustbridge']

# Each service gets a unique, category-appropriate Unsplash image
IMAGE_MAP = {
    # RESTAURANTS — 3 different restaurant/food images
    "Virasat – The Exotic Veg":
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",   # fine dining table
    "Ujwala Grand Restaurant":
        "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop",   # indian food spread
    "The Nosh Bistro":
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",   # bistro food

    # HOSTELS — 3 different room/accommodation images
    "RamaDevi Boys Hostel":
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop",   # hostel bunk beds
    "Sri Sai Manikanta Women's PG":
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",   # clean room
    "Sri Vasavi Women's Hostel":
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&h=400&fit=crop",   # hostel corridor/rooms

    # GROCERY STORES — 2 different grocery images
    "Seven To Ten Convenience Store":
        "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&h=400&fit=crop",   # convenience store shelves
    "Vishal Mart":
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop",   # supermarket aisle

    # PHARMACIES — 2 completely different pharmacy images
    "Sri Adithya Pharmacy":
        "https://images.unsplash.com/photo-1583912086096-8c60d75a537f?w=600&h=400&fit=crop",   # pharmacy counter
    "Apollo Pharmacy Bachupally":
        "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=400&fit=crop",   # medicine bottles/pharmacy

    # CLINICS — 2 different clinic images
    "Edvenswa Holistic Healthcare":
        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop",   # doctor consultation
    "Little Tooth Stories":
        "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop",   # dental chair/clinic
}

print("Updating service images with unique URLs...\n")
updated = 0
for title, img_url in IMAGE_MAP.items():
    result = db.services.update_one(
        {"title": title},
        {"$set": {"images": [img_url]}}
    )
    status = "✓" if result.matched_count else "✗ NOT FOUND"
    print(f"  {status}  {title}")
    if result.matched_count:
        updated += 1

print(f"\nUpdated {updated}/{len(IMAGE_MAP)} services.")
client.close()
