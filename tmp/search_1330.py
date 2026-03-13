import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
# Le fichier est dans antigravity_cloud/functions/.env
dotenv_path = os.path.join("antigravity_cloud", "functions", ".env")
load_dotenv(dotenv_path)

def query_messages_with_env(chat_id, start_time_iso):
    # Initialisation de Firebase avec la clé de service du .env
    firebase_config = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if not firebase_config:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT not found in .env")
        
    cred_dict = json.loads(firebase_config)
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        
    db = firestore.client()
    
    start_time = datetime.fromisoformat(start_time_iso)
    
    messages_ref = db.collection("chats").document(str(chat_id)).collection("messages")
    query = messages_ref.where("timestamp", ">=", start_time).order_by("timestamp")
    
    docs = query.stream()
    
    results = []
    for doc in docs:
        data = doc.to_dict()
        results.append({
            "role": data.get("role"),
            "content": data.get("content"),
            "timestamp": data.get("timestamp").isoformat() if data.get("timestamp") else None
        })
    
    return results

if __name__ == "__main__":
    chat_id = "6722033496"
    # Aujourd'hui 12 mars à 13h00 locale (+01:00)
    # On va chercher un peu plus tôt pour être sûr de ne rien rater
    start_time_iso = "2026-03-12T13:00:00+01:00"
    
    try:
        messages = query_messages_with_env(chat_id, start_time_iso)
        print(json.dumps(messages, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")
