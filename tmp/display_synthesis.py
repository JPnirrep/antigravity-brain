import json
import os

def display_synthesis():
    file_path = 'tmp/messages_1330.json'
    if not os.path.exists(file_path):
        print("Erreur : Fichier non trouvé.")
        return

    try:
        with open(file_path, 'r', encoding='utf-16') as f:
            data = json.load(f)
        
        found = False
        synthesis = ""
        for m in data:
            if 'configuration optimale' in m['content'].lower() and m['role'] == 'user':
                found = True
            elif found and m['role'] == 'assistant':
                synthesis = m['content']
                break
        
        if synthesis:
            print("--- SYNTHÈSE DE LA CONFIGURATION OPTIMALE (13h30) ---")
            print(synthesis)
        else:
            print("Aucune synthèse trouvée après la demande utilisateur.")
            
    except Exception as e:
        print(f"Erreur : {e}")

if __name__ == "__main__":
    display_synthesis()
