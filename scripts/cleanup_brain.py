import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

def cleanup_brain(start_time_str, end_time_str, chat_id="6722033496"):
    """
    Supprime les messages dans une fenêtre temporelle donnée.
    Format attendu : 'YYYY-MM-DD HH:MM:SS'
    """
    env_path = "antigravity_cloud/functions/.env"
    if os.path.exists(env_path):
        load_dotenv(env_path)
    
    sa_info = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if not sa_info:
        print("❌ Erreur : FIREBASE_SERVICE_ACCOUNT non trouvé.")
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(json.loads(sa_info))
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    start_dt = datetime.strptime(start_time_str, "%Y-%m-%d %H:%M:%S")
    end_dt = datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S")
    
    query_ref = db.collection("chats").document(chat_id).collection("messages")
    messages = query_ref.where("timestamp", ">=", start_dt) \
                       .where("timestamp", "<=", end_dt) \
                       .stream()

    count = 0
    for doc in messages:
        print(f"🗑️ Suppression du message ID: {doc.id} ({doc.to_dict().get('timestamp')})")
        doc.reference.delete()
        count += 1
    
    print(f"\n✅ Nettoyage terminé : {count} messages supprimés.")

if __name__ == "__main__":
    # Fenêtre : Hier (2026-03-12) entre 21:10 et 21:30
    cleanup_brain("2026-03-12 21:10:00", "2026-03-12 21:30:00")
