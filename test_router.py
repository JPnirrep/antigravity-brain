import sys
import os

# Ajouter le chemin du routeur global
router_path = os.path.join(os.path.expanduser("~"), ".agents", "global_router")
sys.path.append(router_path)

try:
    from cognitive_router import CognitiveRouter
except ImportError as e:
    print(f"Erreur d'import : {e}")
    sys.exit(1)

print("--- Test de l'Orchestrateur Global ---")
print("Tentative de requête via OpenRouter (Niveau 1b - Modèle Gratuit Mistral)...")

try:
    response = CognitiveRouter.chat_completion(
        model="meta-llama/llama-3-8b-instruct:free",
        messages=[{"role": "user", "content": "Bonjour ! Agis comme une IA et réponds en une seule phrase courte pour confirmer que la connexion est établie."}]
    )
    
    msg = response.get("choices", [{}])[0].get("message", {}).get("content", "Pas de contenu.")
    print("\n[RÉPONSE OPENROUTER]")
    print(f"Modèle retourné : {response.get('model', 'inconnu')}")
    print(msg)
    
    print("\nTest réussi ! Vérifiez vos logs dans ~/.agents/global_router/api_routing.log")
except Exception as e:
    print(f"\nÉchec du test : {e}")
