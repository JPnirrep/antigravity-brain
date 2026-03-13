import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

def query_brain(query_time_str=None, chat_id="6722033496", limit=50):
    """
    Outil permanent pour interroger la mémoire Telegram (Anti-Gravity Bot).
    """
    # 1. Chargement des credentials
    env_path = "antigravity_cloud/functions/.env"
    if os.path.exists(env_path):
        load_dotenv(env_path)
    
    sa_info = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if not sa_info:
        print("❌ Erreur : FIREBASE_SERVICE_ACCOUNT non trouvé dans le .env")
        return

    # 2. Initialisation Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate(json.loads(sa_info))
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()

    # 3. Définition de la fenêtre temporelle
    # Si query_time_str est fourni (ex: "13:30"), on cherche autour de cette heure aujourd'hui
    # Sinon on cherche les derniers messages.
    now = datetime.now()
    
    query_ref = db.collection("chats").document(chat_id).collection("messages")
    
    if query_time_str:
        try:
            h, m = map(int, query_time_str.split(':'))
            target_time = now.replace(hour=h, minute=m, second=0, microsecond=0)
            start_time = target_time - timedelta(minutes=30)
            end_time = target_time + timedelta(minutes=30)
            
            messages = query_ref.where("timestamp", ">=", start_time) \
                               .where("timestamp", "<=", end_time) \
                               .order_by("timestamp", direction=firestore.Query.ASCENDING) \
                               .stream()
        except Exception as e:
            print(f"⚠️ Erreur format heure, repli sur les derniers messages : {e}")
            messages = query_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()
    else:
        messages = query_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()

    # 4. Extraction et Affichage
    results = []
    for doc in messages:
        m = doc.to_dict()
        ts = m.get('timestamp')
        time_str = ts.strftime("%H:%M:%S") if ts else "??:??:??"
        results.append({
            "role": m.get('role'),
            "content": m.get('content'),
            "time": time_str
        })
    
    # Inverser pour l'ordre chronologique si on a pris les derniers
    if not query_time_str:
        results.reverse()

    return results

if __name__ == "__main__":
    import sys
    time_arg = sys.argv[1] if len(sys.argv) > 1 else None
    msgs = query_brain(time_arg)
    
    if msgs:
        print(f"\n🧠 --- EXTRACTION MÉMOIRE BRAIN ({time_arg or 'Derniers messages'}) ---")
        for m in msgs:
            role_label = "👤 VOUS" if m['role'] == 'user' else "⚙️ BOT"
            print(f"[{m['time']}] {role_label}: {m['content'][:200]}..." if len(m['content']) > 200 else f"[{m['time']}] {role_label}: {m['content']}")
            print("-" * 30)
    else:
        print("📭 Aucun message trouvé dans cette fenêtre.")
