import requests

BASE = "http://localhost:8000"

# Check which version is running
h = requests.get(f"{BASE}/health")
print(f"Health: {h.json()}")

tests = [
    ("The biryani was excellent and service was prompt.",                              "Ujwala Grand Restaurant", "Restaurants", True),
    ("I stayed at this hostel. Rooms were clean and rent was affordable.",              "Ujwala Grand Restaurant", "Restaurants", False),
    ("Doctor was helpful and the clinic was clean.",                                    "Apollo Clinic",           "Clinics",      True),
    ("The food was delicious and the portions were generous.",                          "Apollo Clinic",           "Clinics",      False),
    ("Good WiFi and clean rooms. Staff was helpful.",                                   "Bachupally PG Hostel",    "Hostels",      True),
    ("Vegetables were fresh and delivery was on time.",                                 "Fresh Mart Grocery",      "Grocery Stores", True),
    ("The haircut was neat and staff were professional.",                               "Style Studio Salon",      "Salons",       True),
    ("Driver was on time and the car was clean.",                                       "Bachupally Cabs",         "Transportation", True),
    ("The food changed my life. Best restaurant in the universe.",                      "Lucky Restaurant",        "Restaurants",  True),   # fake but relevant
    ("I bought medicines and the pharmacist was knowledgeable.",                        "MedPlus Pharmacy",        "Pharmacies",   True),
    ("The hostel rooms were great. But the restaurant next door had amazing biryani.",  "City PG Hostel",          "Hostels",      True),   # mentions restaurant but hostel words dominate
]

print(f"\n{'RELEVANT':>9} {'EXPECT':>7} {'OK':>4}  SERVICE | REVIEW")
print("-"*90)
passed = 0
for review, name, cat, expected in tests:
    r = requests.post(f"{BASE}/relevance", json={
        "review_text": review, "service_name": name, "service_category": cat, "service_description": ""
    })
    d = r.json()
    got = d['is_relevant']
    ok  = "✓" if got == expected else "✗"
    if got == expected: passed += 1
    print(f"{str(got):>9} {str(expected):>7} {ok:>4}  {name[:22]:22} | {review[:55]}")

print(f"\n{passed}/{len(tests)} passed")
