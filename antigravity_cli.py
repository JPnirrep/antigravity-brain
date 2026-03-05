import sys
import os
import json

# Ajout du chemin vers le routeur global
ROUTER_PATH = r"C:\Users\JP\.agents\global_router"
sys.path.append(ROUTER_PATH)

try:
    from cognitive_router import CognitiveRouter
except ImportError:
    print(f"Erreur : Impossible de charger le CognitiveRouter depuis {ROUTER_PATH}")
    sys.exit(1)

def main():
    print("=== Antigravity Terminal CLI (Fast Mode) ===")
    print("Modèles : 'mercury-2' ou 'anthropic/claude-3-haiku'")
    print("Commandes : /model [nom], exit")
    print("-" * 40)

    model = "anthropic/claude-3-haiku"
    history = []
    nb_path = r"C:\Users\JP\.agents\g.nb"

    while True:
        try:
            user_input = input(f"\n[{model}] User > ").strip()
        except KeyboardInterrupt:
            break
            
        if not user_input:
            continue
            
        if user_input.lower() in ['exit', 'quit']:
            break
        
        if user_input.startswith("/model "):
            model = user_input.replace("/model ", "").strip()
            print(f"Modèle changé pour : {model}")
            continue

        if user_input == "/nb":
            if os.path.exists(nb_path):
                with open(nb_path, "r", encoding="utf-8") as f:
                    print("\n--- GLOBAL NOTEBOOK (g.nb) ---")
                    print(f.read())
                    print("-" * 30)
            else:
                print("NoteBook g.nb introuvable.")
            continue

        if user_input.startswith("/nb+"):
            note = user_input.replace("/nb+", "").strip()
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d")
            formatted_note = f"[{timestamp}|USER|NOTE] {note}\n"
            with open(nb_path, "a", encoding="utf-8") as f:
                f.write(formatted_note)
            print("Note ajoutée au g.nb.")
            continue


        history.append({"role": "user", "content": user_input})
        
        print("\nAntigravity > ", end="", flush=True)
        
        try:
            full_response = ""
            # On récupère le générateur depuis le router
            stream_gen = CognitiveRouter.chat_completion(model=model, messages=history, stream=True)
            
            for chunk in stream_gen:
                if chunk.startswith("data: "):
                    content = chunk[6:].strip()
                    if content == "[DONE]":
                        break
                    try:
                        data = json.loads(content)
                        if "choices" in data and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            text = delta.get("content", "")
                            if text:
                                print(text, end="", flush=True)
                                full_response += text
                    except json.JSONDecodeError:
                        continue
            
            if full_response:
                history.append({"role": "assistant", "content": full_response})
            else:
                print("[Pas de réponse reçue du fournisseur]")
            print() 
            
        except Exception as e:
            print(f"\n[ERREUR] {str(e)}")

if __name__ == "__main__":
    main()
