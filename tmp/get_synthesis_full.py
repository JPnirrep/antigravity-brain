import json
import os

def get_full_synthesis(file_path):
    encodings = ['utf-16', 'utf-8']
    messages = []
    
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
                if '[' in content:
                    messages = json.loads(content[content.find('['):])
                break
        except Exception:
            continue
            
    # On cherche le message de synthèse (assistant, autour de 13h30 locale = 12h30 UTC, et long)
    # Dans les résultats précedent, c'était le dernier message.
    for msg in reversed(messages):
        if msg.get('role') == 'assistant' and len(msg.get('content', '')) > 1000:
            return msg.get('content')
    return "Synthèse non trouvée."

if __name__ == "__main__":
    file_path = os.path.join("tmp", "messages_1330.json")
    print(get_full_synthesis(file_path))
