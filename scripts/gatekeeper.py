import hashlib
import json
import os
import sys
import subprocess

def get_hash(filepath):
    sha256_hash = hashlib.sha256()
    if not os.path.exists(filepath):
        return None
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def verify_and_run(script_path, args):
    filename = os.path.basename(script_path)
    trust_store_path = "registry/trust_store.json"
    
    if not os.path.exists(trust_store_path):
        print("❌ ERREUR : Aucun registre de confiance trouvé. Certifiez vos scripts d'abord.")
        return

    with open(trust_store_path, 'r') as f:
        trust_data = json.load(f)

    agent_info = trust_data[filename]
    # Compatibility check for old registry format
    if isinstance(agent_info, str):
        stored_hash = agent_info
        budget_limit = 0.50
    else:
        stored_hash = agent_info["hash"]
        budget_limit = agent_info.get("budget_limit", 0.50)

    if budget_limit <= 0:
        print(f"💰 STOP : Le budget pour '{filename}' est épuisé (0.00$).")
        return

    current_hash = get_hash(script_path)
    if current_hash != stored_hash:
        print(f"🚨 ALERTE : Le code génétique de '{filename}' a été altéré !")
        print(f"DANGER : Le hash actuel ne correspond plus au certificat.")
        return

    # Si tout est OK, on lance le script original
    print(f"🟢 Accès accordé pour '{filename}'. Exécution...")
    try:
        cmd = [sys.executable, script_path] + args
        subprocess.run(cmd, check=True)
    except Exception as e:
        print(f"❌ Erreur pendant l'exécution : {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python gatekeeper.py <script_to_run.py> [args...]")
        sys.exit(1)
    
    verify_and_run(sys.argv[1], sys.argv[2:])
