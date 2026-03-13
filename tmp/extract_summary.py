import json
import os

# Liste des mots clés à chercher dans la conversation
keywords = ["configuration optimale", "antigravity brain", "open code", "open router", "Mercury API"]

def extract_summary(file_path):
    # Essayer plusieurs encodings pour Windows
    encodings = ['utf-16', 'utf-8', 'cp1252']
    messages = []
    
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
                # Nettoyer les éventuels warnings au début du fichier (si présents)
                if content.startswith('['):
                    messages = json.loads(content)
                elif '[' in content:
                    messages = json.loads(content[content.find('['):])
                break
        except Exception:
            continue
            
    if not messages:
        return "Aucun message trouvé ou erreur de lecture."
        
    summary_messages = []
    for msg in messages:
        content = msg.get('content', '')
        # Si le message contient un des mots clés, on le garde
        if any(kw.lower() in content.lower() for kw in keywords):
            summary_messages.append(msg)
        # Si c'est un message très long de l'assistant, c'est probablement la synthèse
        elif msg.get('role') == 'assistant' and len(content) > 500:
             summary_messages.append(msg)
             
    return summary_messages

if __name__ == "__main__":
    file_path = os.path.join("tmp", "messages_1330.json")
    summary = extract_summary(file_path)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
