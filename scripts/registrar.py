import hashlib
import json
import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from sentinel_scan import audit_file

def get_hash(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def certify(filepath, chat_id="6722033496"):
    filename = os.path.basename(filepath)
    print(f"🧐 Certification de : {filename}...")
    
    # 1. Audit Sentinel
    is_safe, reports = audit_file(filepath)
    if not is_safe:
        print("🛑 ALERTE SÉCURITÉ : Sentinel a détecté des anomalies.")
        for r in reports:
            print(f"  {r}")
        # On ne bloque pas forcément pour le propriétaire, mais on signale.
    
    # 2. Empreinte
    file_hash = get_hash(filepath)
    
    # 3. Firestore
    try:
        env_path = "antigravity_cloud/functions/.env"
        if os.path.exists(env_path):
            from dotenv import load_dotenv
            load_dotenv(env_path)
        
        sa_info = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if sa_info:
            if not firebase_admin._apps:
                cred = credentials.Certificate(json.loads(sa_info))
                firebase_admin.initialize_app(cred)
            db = firestore.client()
            
            id_data = {
                "name": filename,
                "hash": file_hash,
                "certified_at": firestore.SERVER_TIMESTAMP,
                "status": "VALIDATED" if is_safe else "WARNING",
                "budget_limit": 0.50,  # $0.50 par défaut par session
                "role": "worker"       # Rôle par défaut
            }
            db.collection("trust_registry").document(filename).set(id_data)
            print(f"✅ Certificat [Budget: {id_data['budget_limit']}$] synchronisé dans Firestore.")
    except Exception as e:
        print(f"⚠️ Erreur synchro Cloud (continuons en local) : {e}")

    # 4. Local Trust Store (Vélocité)
    trust_store_path = "registry/trust_store.json"
    trust_data = {}
    if os.path.exists(trust_store_path):
        with open(trust_store_path, 'r') as f:
            trust_data = json.load(f)
    
    trust_data[filename] = {
        "hash": file_hash,
        "budget_limit": 0.50,
        "role": "worker"
    }
    with open(trust_store_path, 'w') as f:
        json.dump(trust_data, f, indent=4)
    
    print(f"🎉 Agent certifié avec succès ! Hash : {file_hash[:10]}...")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python registrar.py <file_path>")
        sys.exit(1)
    certify(sys.argv[1])
