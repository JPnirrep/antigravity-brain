import os
import json
from google.cloud import firestore
from datetime import datetime, timezone, timedelta

def query_messages(chat_id, start_time_iso):
    db = firestore.Client(project="antigravity-brain-79792")
    
    # Heure de début
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
    # Midi aujourd'hui (11 mars 2026) en local (+01:00) -> 12:00:00+01:00 corresponds to 11:00:00Z
    # Mais le serveur utilise peut-être UTC. Pour être sûr, on prend depuis 10:00Z.
    start_time_iso = "2026-03-11T11:00:00+00:00"
    
    try:
        messages = query_messages(chat_id, start_time_iso)
        print(json.dumps(messages, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")
