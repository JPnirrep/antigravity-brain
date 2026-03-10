import firebase_admin
from firebase_admin import credentials, firestore

def get_last_exchange():
    if not firebase_admin._apps:
        try:
            firebase_admin.initialize_app()
        except Exception:
            # Si ADC échoue, on tente sans arguments (pourrait marcher si gcloud est lié)
            firebase_admin.initialize_app()
            
    db = firestore.client()
    
    print("Recherche du dernier échange...")
    
    # On récupère tous les chats
    chats_ref = db.collection("chats")
    chats = chats_ref.stream()
    
    last_message = None
    target_chat_id = None
    
    # On cherche le chat qui a le message le plus récent
    for chat in chats:
        chat_id = chat.id
        messages_ref = db.collection("chats").doc(chat_id).collection("messages")
        # On prend le message le plus récent de ce chat
        latest_msg_doc = messages_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1).get()
        
        if latest_msg_doc:
            msg_data = latest_msg_doc[0].to_dict()
            ts = msg_data.get("timestamp")
            if ts and (not last_message or ts > last_message.get("timestamp")):
                last_message = msg_data
                target_chat_id = chat_id

    if target_chat_id:
        print(f"\n--- Derniers messages du Chat ID: {target_chat_id} ---")
        messages_ref = db.collection("chats").doc(target_chat_id).collection("messages")
        # On récupère les 4 derniers messages pour avoir le contexte de l'échange
        last_msgs = messages_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(4).get()
        
        # On les affiche du plus vieux au plus récent
        for m in reversed(last_msgs):
            data = m.to_dict()
            role = data.get("role", "unknown").upper()
            content = data.get("content", "")
            time = data.get("timestamp")
            time_str = time.strftime("%Y-%m-%d %H:%M:%S") if time else "N/A"
            print(f"[{time_str}] {role}:")
            print(f"{content}")
            print("-" * 20)
    else:
        print("Aucun message trouvé.")

if __name__ == "__main__":
    get_last_exchange()
