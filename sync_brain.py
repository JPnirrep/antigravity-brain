import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from datetime import datetime

# Configuration
BRICKS_DIR = "bricks"
MEMORY_HUB = "brain/perpetual_memory.md"

def sync_from_firestore():
    """
    Récupére les messages et les briques de Firestore pour les synchroniser localement.
    NOTE: Nécessite que l'utilisateur fournisse le chemin vers serviceAccountKey.json
    si on veut éviter d'utiliser les identifiants par défaut de l'ADC.
    """
    print("🚀 Démarrage de la synchronisation Antigravity Brain...")
    
    # Tentative d'initialisation
    try:
        if not firebase_admin._apps:
            # On cherche le fichier de clé dans les endroits probables
            key_path = "serviceAccountKey.json"
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
            else:
                print("⚠️ serviceAccountKey.json non trouvé. Tentative via Application Default Credentials...")
                firebase_admin.initialize_app()
                
        db = firestore.client()
        
        # 1. Synchronisation des "Bricks" (Palier 3)
        print("🧱 Synchro des briques de connaissance...")
        bricks_ref = db.collection("bricks")
        docs = bricks_ref.stream()
        
        if not os.path.exists(BRICKS_DIR):
            os.makedirs(BRICKS_DIR)
            
        count = 0
        for doc in docs:
            data = doc.to_dict()
            title = data.get("title", "Sans titre").replace(" ", "_").lower()
            date_str = data.get("createdAt").strftime("%Y-%m-%d") if data.get("createdAt") else "no-date"
            filename = f"{BRICKS_DIR}/{date_str}_{title}.md"
            
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"# 🧱 {data.get('title')}\n")
                f.write(f"**Source:** {data.get('source', 'Firestore')}\n")
                f.write(f"**Tags:** {', '.join(data.get('tags', []))}\n\n")
                f.write(data.get("content", ""))
            count += 1
            
        print(f"✅ {count} briques synchronisées.")
        
        # 2. Mise à jour du Hub de Mémoire (Palier 2 / Index)
        # TODO: Implémenter la logique de mise à jour de perpetual_memory.md
        
    except Exception as e:
        print(f"❌ Erreur de synchronisation : {e}")

if __name__ == "__main__":
    sync_from_firestore()
