import requests
import json

URL = "https://us-central1-antigravity-brain-79792.cloudfunctions.net/antigravityBot"

payload = {
    "message": {
        "chat": {
            "id": 12345
        },
        "text": "Coucou, c'est ta première connexion au cloud ?"
    }
}

try:
    response = requests.post(URL, json=payload, timeout=30)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
