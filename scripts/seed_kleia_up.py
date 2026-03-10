import firebase_admin
from firebase_admin import credentials, firestore
import json
import yaml
import os

# Configuration
KNOWLEDGE_PATH = "knowledge/KLEIA-UP/"

def seed_knowledge():
    print("🌱 Initialisation de la base de connaissances KLEIA-UP dans Firestore...")
    
    # Initialisation Firebase
    if not firebase_admin._apps:
        key_path = "serviceAccountKey.json"
        if os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
        else:
            print("⚠️ serviceAccountKey.json non trouvé. Utilisation de l'ADC.")
            firebase_admin.initialize_app()
            
    db = firestore.client()
    
    # 1. Seed Index Map
    with open(os.path.join(KNOWLEDGE_PATH, "index_map.json"), "r", encoding="utf-8") as f:
        index_map = json.load(f)
        db.collection("config").document("kleia_index").set(index_map)
        print("✅ Index Map seedé.")

    # 2. Seed Data Vault (Fragments)
    with open(os.path.join(KNOWLEDGE_PATH, "data_vault.yaml"), "r", encoding="utf-8") as f:
        data_vault = yaml.safe_load(f)
        
        # On découpe par thématique pour le "shaving"
        fragments = {
            "identity": [ex for ex in data_vault["core_exercises_13"] if ex["source"] in ["L1", "L5"]],
            "stress_logic": [ex for ex in data_vault["core_exercises_13"] if ex["source"] == "L2"],
            "physical_performance": [ex for ex in data_vault["core_exercises_13"] if "L3" in ex["source"] or "L4" in ex["source"] or "V1" in ex["source"]],
            "content_structure": [ex for ex in data_vault["core_exercises_13"] if ex["source"] == "L5" or ex["source"] == "L6"]
        }
        
        for frag_id, excs in fragments.items():
            content = "\n".join([f"- {ex['name']} : {ex['goal']} (Source: {ex['source']})" for ex in excs])
            db.collection("kleia_knowledge_base").document(frag_id).set({
                "content": content,
                "updatedAt": firestore.SERVER_TIMESTAMP
            })
            print(f"✅ Fragment {frag_id} seedé.")

    print("🚀 Seeding terminé avec succès !")

if __name__ == "__main__":
    seed_knowledge()
