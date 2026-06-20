"""
Add 4 realistic medical services to TrustBridge MongoDB.
Runs without touching the seed file — preserves all existing services.
"""
from pymongo import MongoClient
from bson import ObjectId
from dotenv import dotenv_values
from datetime import datetime, timedelta
import os

env = dotenv_values(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
client = MongoClient(env['MONGODB_URI'])
db = client['trustbridge']

# Get provider user to attach services to
provider = db.users.find_one({"role": "provider"})
provider_id = provider["_id"]

provider_profile = db.providerprofiles.find_one({"user": provider_id})
provider_profile_id = provider_profile["_id"] if provider_profile else None

print(f"Using provider: {provider['name']} ({provider['email']})")

AVAIL = {
    "monday":    {"open": "08:00", "close": "20:00", "closed": False},
    "tuesday":   {"open": "08:00", "close": "20:00", "closed": False},
    "wednesday": {"open": "08:00", "close": "20:00", "closed": False},
    "thursday":  {"open": "08:00", "close": "20:00", "closed": False},
    "friday":    {"open": "08:00", "close": "20:00", "closed": False},
    "saturday":  {"open": "09:00", "close": "17:00", "closed": False},
    "sunday":    {"open": "09:00", "close": "13:00", "closed": False},
}

AVAIL_24_7 = {
    "monday":    {"open": "00:00", "close": "23:59", "closed": False},
    "tuesday":   {"open": "00:00", "close": "23:59", "closed": False},
    "wednesday": {"open": "00:00", "close": "23:59", "closed": False},
    "thursday":  {"open": "00:00", "close": "23:59", "closed": False},
    "friday":    {"open": "00:00", "close": "23:59", "closed": False},
    "saturday":  {"open": "00:00", "close": "23:59", "closed": False},
    "sunday":    {"open": "00:00", "close": "23:59", "closed": False},
}

AVAIL_LAB = {
    "monday":    {"open": "07:00", "close": "21:00", "closed": False},
    "tuesday":   {"open": "07:00", "close": "21:00", "closed": False},
    "wednesday": {"open": "07:00", "close": "21:00", "closed": False},
    "thursday":  {"open": "07:00", "close": "21:00", "closed": False},
    "friday":    {"open": "07:00", "close": "21:00", "closed": False},
    "saturday":  {"open": "07:00", "close": "19:00", "closed": False},
    "sunday":    {"open": "08:00", "close": "13:00", "closed": False},
}

services = [
    {
        "provider":        provider_id,
        "providerProfile": provider_profile_id,
        "title":           "KK Clinic & Diagnostics",
        "description":     (
            "KK Clinic & Diagnostics is a trusted general practice and diagnostic centre "
            "serving the Bachupally–Nizampet corridor. Offers comprehensive consultations for "
            "fever, infections, and chronic conditions alongside in-house diagnostics including "
            "blood tests, urine analysis, ECG, and X-ray. Known for quick turnaround on reports "
            "and affordable consultation fees. Home sample collection available on request."
        ),
        "category":    "Clinics",
        "location":    "Bachupally",
        "address":     "Plot No. 18, Nizampet Road, Near Water Tank, Bachupally, Hyderabad – 500090",
        "contactNumber": "9848112233",
        "businessEmail": "kkclinic.bachupally@gmail.com",
        "price":       300,
        "priceUnit":   "consultation",
        "images": [
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop"
        ],
        "averageRating": 4.3,
        "totalReviews":  22,
        "totalBookings": 61,
        "isVisible":   True,
        "isFeatured":  False,
        "isActive":    True,
        "workflowStatus": "published",
        "availability": AVAIL,
        "docVerification": {"identityPassed": True, "businessPassed": False},
        "createdAt": datetime.utcnow() - timedelta(days=45),
        "updatedAt": datetime.utcnow(),
    },
    {
        "provider":        provider_id,
        "providerProfile": provider_profile_id,
        "title":           "Harsha Hospital",
        "description":     (
            "Harsha Hospital is a well-established multi-speciality hospital in Kukatpally "
            "offering 24/7 emergency care, general medicine, orthopaedics, gynaecology, and "
            "paediatrics. Equipped with modern OT facilities, ICU, and a fully-staffed emergency "
            "department. Trusted by residents across Kukatpally, KPHB, and Bachupally for over "
            "15 years. Cashless insurance accepted. Ambulance service available."
        ),
        "category":    "Clinics",
        "location":    "Miyapur",
        "address":     "H.No. 8-2-120, KPHB Colony Phase 6, Kukatpally, Hyderabad – 500072",
        "contactNumber": "040-23456890",
        "businessEmail": "harshahospital.kphb@gmail.com",
        "price":       500,
        "priceUnit":   "consultation",
        "images": [
            "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop"
        ],
        "averageRating": 4.5,
        "totalReviews":  47,
        "totalBookings": 138,
        "isVisible":   True,
        "isFeatured":  True,
        "isActive":    True,
        "workflowStatus": "published",
        "availability": AVAIL_24_7,
        "docVerification": {"identityPassed": True, "businessPassed": True},
        "createdAt": datetime.utcnow() - timedelta(days=60),
        "updatedAt": datetime.utcnow(),
    },
    {
        "provider":        provider_id,
        "providerProfile": provider_profile_id,
        "title":           "Apollo Diagnostics Kukatpally",
        "description":     (
            "Apollo Diagnostics in Kukatpally is part of the Apollo Health & Lifestyle network — "
            "India's largest diagnostics chain. Offers 2,000+ diagnostic tests including routine "
            "blood panels, lipid profiles, thyroid function, HbA1c, COVID-19 testing, full body "
            "health checkup packages, and radiology. NABL-accredited lab with accurate results "
            "delivered digitally within hours. Home collection available across Bachupally, Miyapur, "
            "and KPHB Colony."
        ),
        "category":    "Clinics",
        "location":    "Miyapur",
        "address":     "Ground Floor, Manjeera Mall, Kukatpally Housing Board Colony, Hyderabad – 500072",
        "contactNumber": "040-44886200",
        "businessEmail": "apollodiag.kukatpally@apollohospitals.com",
        "website":     "www.apollodiagnostics.in",
        "price":       250,
        "priceUnit":   "starting from",
        "images": [
            "https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&h=400&fit=crop"
        ],
        "averageRating": 4.6,
        "totalReviews":  63,
        "totalBookings": 201,
        "isVisible":   True,
        "isFeatured":  True,
        "isActive":    True,
        "workflowStatus": "published",
        "availability": AVAIL_LAB,
        "docVerification": {"identityPassed": True, "businessPassed": True},
        "createdAt": datetime.utcnow() - timedelta(days=90),
        "updatedAt": datetime.utcnow(),
    },
    {
        "provider":        provider_id,
        "providerProfile": provider_profile_id,
        "title":           "Udbhava Multi Speciality Hospitals",
        "description":     (
            "Udbhava Multi Speciality Hospital in Miyapur provides comprehensive inpatient and "
            "outpatient care across cardiology, neurology, orthopaedics, general surgery, and "
            "internal medicine. Features advanced diagnostic imaging (CT, MRI, ultrasound), "
            "dedicated maternity wing, neonatal ICU, and a well-equipped pharmacy. Empanelled "
            "with major insurance providers including Star Health, HDFC ERGO, and CGHS. "
            "Serving Miyapur, Bachupally, and Chandanagar since 2009."
        ),
        "category":    "Clinics",
        "location":    "Miyapur",
        "address":     "Plot No. 3 & 4, Miyapur Main Road, Near Miyapur Metro Station, Hyderabad – 500049",
        "contactNumber": "040-67891234",
        "businessEmail": "udbhava.miyapur@gmail.com",
        "price":       600,
        "priceUnit":   "consultation",
        "images": [
            "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=600&h=400&fit=crop"
        ],
        "averageRating": 4.4,
        "totalReviews":  38,
        "totalBookings": 112,
        "isVisible":   True,
        "isFeatured":  False,
        "isActive":    True,
        "workflowStatus": "published",
        "availability": AVAIL_24_7,
        "docVerification": {"identityPassed": True, "businessPassed": True},
        "createdAt": datetime.utcnow() - timedelta(days=30),
        "updatedAt": datetime.utcnow(),
    },
]

print("\nInserting medical services...")
result = db.services.insert_many(services)
print(f"✓ Inserted {len(result.inserted_ids)} services:\n")

for svc in services:
    print(f"  • {svc['title']} — {svc['location']} — ₹{svc['price']}/{svc['priceUnit']}")

print(f"\nTotal services in DB: {db.services.count_documents({})}")
client.close()
