import firebase_admin
from firebase_admin import credentials, firestore
import os

# Configuration
NB_PATH = r"C:\Users\JP\.agents\g.nb"
PROJECT_ID = "antigravity-brain-79792"

def sync():
    print("🔄 Synchronisation du Global Notebook (Cloud -> Local)...")
    
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': PROJECT_ID,
        })

    db = firestore.client()
    
    # On récupère les briques avec le tag AUTO ou SYSTEM_MODE
    bricks_ref = db.collection("bricks")
    query = bricks_ref.order_by("createdAt", direction=firestore.Query.ASCENDING).stream()

    existing_notes = []
    if os.path.exists(NB_PATH):
        with open(NB_PATH, "r", encoding="utf-8") as f:
            existing_notes = f.readlines()

    new_entries = 0
    with open(NB_PATH, "a", encoding="utf-8") as f:
        for doc in query:
            data = doc.to_dict()
            # On vérifie si c'est une note système ou auto
            if "tags" in data and ("AUTO" in data["tags"] or "MODE" in data["tags"]):
                timestamp = data["createdAt"].strftime("%Y%m%d")
                title = data.get("title", "NOTE")
                content = data.get("content", "")
                
                entry = f"[{timestamp}|CLOUD|{title}] {content}\n"
                
                # Vérification ultra-basique pour éviter les doublons
                if entry not in existing_notes:
                    f.write(entry)
                    new_entries += 1

    print(f"✅ Synchronisation terminée. {new_entries} nouvelles entrées ajoutées.")

if __name__ == "__main__":
    sync()
