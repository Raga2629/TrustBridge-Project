"""
Fix service images in MongoDB to match correct categories.
"""
from pymongo import MongoClient
from dotenv import dotenv_values
import os

env = dotenv_values(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
client = MongoClient(env['MONGODB_URI'])
db = client['trustbridge']

# Correct category-appropriate images for each service
IMAGE_MAP = {
    "Virasat – The Exotic Veg":          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    "Ujwala Grand Restaurant":            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
    "The Nosh Bistro":                    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop",
    "RamaDevi Boys Hostel":               "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop",
    "Sri Sai Manikanta Women's PG":       "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
    "Sri Vasavi Women's Hostel":          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    "Seven To Ten Convenience Store":     "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop",
    "Vishal Mart":                        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop",
    "Sri Adithya Pharmacy":               "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&h=400&fit=crop",
    "Apollo Pharmacy Bachupally":         "https://images.unsplash.com/photo-1587854692152-c10426529373?w=600&h=400&fit=crop",
    "Edvenswa Holistic Healthcare":       "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop",
    "Little Tooth Stories":               "https://images.unsplash.com/photo-1588776814546-1ffbb3b74e38?w=600&h=400&fit=crop",
}

print("Updating service images...\n")
updated = 0
for title, img_url in IMAGE_MAP.items():
    result = db.services.update_one(
        {"title": title},
        {"$set": {"images": [img_url]}}
    )
    if result.matched_count:
        print(f"  ✓ {title}")
        updated += 1
    else:
        print(f"  ✗ NOT FOUND: {title}")

print(f"\nUpdated {updated}/{len(IMAGE_MAP)} services.")
client.close()
