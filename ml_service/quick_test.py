import requests

r = requests.post("http://localhost:8000/relevance", json={
    "review_text": "Good WiFi and clean rooms. Staff was helpful.",
    "service_name": "Bachupally PG Hostel",
    "service_category": "Hostels",
    "service_description": "PG accommodation with all amenities."
})
print(r.json())

r2 = requests.post("http://localhost:8000/relevance", json={
    "review_text": "I stayed at this hostel for two months. The rooms were clean and rent was affordable.",
    "service_name": "Ujwala Grand Restaurant",
    "service_category": "Restaurants",
    "service_description": "A popular restaurant serving Andhra meals and biryanis."
})
print(r2.json())
