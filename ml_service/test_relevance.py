import requests

BASE = "http://localhost:8000"

tests = [
    # (review, service_name, category, description, expected)
    ("The biryani was excellent and the service was very prompt.", "Ujwala Grand Restaurant", "Restaurants", "A popular restaurant serving Andhra meals and biryanis.", True),
    ("I stayed at this hostel for two months. The rooms were clean and rent was affordable.", "Ujwala Grand Restaurant", "Restaurants", "A popular restaurant serving Andhra meals and biryanis.", False),
    ("Doctor was very helpful and the clinic was clean.", "Apollo Clinic", "Clinics", "Multi-speciality clinic with experienced doctors.", True),
    ("The food was delicious and the portions were generous.", "Apollo Clinic", "Clinics", "Multi-speciality clinic with experienced doctors.", False),
    ("Good WiFi and clean rooms. Staff was helpful.", "Bachupally PG Hostel", "Hostels", "PG accommodation with all amenities.", True),
    ("Vegetables were fresh and delivery was on time.", "Fresh Mart Grocery", "Grocery Stores", "Grocery store with fresh produce and daily essentials.", True),
    ("The haircut was neat and the staff were professional.", "Style Studio Salon", "Salons", "Hair styling and beauty salon.", True),
    ("Driver was on time and the car was clean.", "Bachupally Cabs", "Transportation", "Reliable cab and transportation service.", True),
]

print(f"{'SCORE':>7}  {'EXPECT':>6}  {'RESULT':>6}  TEST")
print("-"*80)
all_pass = True
for review, name, cat, desc, expected in tests:
    r = requests.post(f"{BASE}/relevance", json={
        "review_text": review, "service_name": name,
        "service_category": cat, "service_description": desc
    })
    data = r.json()
    score = data['similarity_score']
    got = data['is_relevant']
    ok = "✓" if got == expected else "✗"
    if got != expected: all_pass = False
    print(f"{score:>7.4f}  {str(expected):>6}  {ok:>6}  {name[:25]} | {review[:50]}")

print(f"\n{'All tests passed ✓' if all_pass else 'Some tests failed ✗'}")
