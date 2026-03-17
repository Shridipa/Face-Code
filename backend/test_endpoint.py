import requests
import json

url = "http://localhost:8001/api/generate_scaffold"
data = {
    "title": "Two Sum",
    "description": "Find two numbers that add up to a target.",
    "language": "javascript"
}
try:
    resp = requests.post(url, json=data)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")
except Exception as e:
    print(f"Error: {e}")
