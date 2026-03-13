import os
import json
import hashlib
import requests
from dotenv import load_dotenv

class AntigravityRouter:
    """
    Orchestrateur intelligent pour OpenRouter.
    Gère le routage par intention, le caching sémantique et l'optimisation des coûts.
    """
    
    # Configuration des modèles (Frugalité vs Puissance)
    MODELS = {
        "fast": "google/gemini-2.0-flash-lite-001", # Ultra rapide et quasi gratuit
        "noble": "mercury-2",                        # Raisonnement profond (via Inception/Mercury API)
        "code": "anthropic/claude-3.5-sonnet",      # La référence pour le code complexe
        "creative": "anthropic/claude-3.5-sonnet",   # Storytelling premium
        "simple": "mistralai/mistral-7b-instruct"    # Classification de base
    }

    def __init__(self):
        # On cherche le .env dans les fonctions ou le root
        env_paths = [".env", "antigravity_cloud/functions/.env"]
        for path in env_paths:
            if os.path.exists(path):
                load_dotenv(path)
                break
        
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.mercury_api_key = os.getenv("INCEPTION_API_KEY") # Pour Mercury-2 en direct si besoin
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY manquante dans l'environnement.")

    def _generate_cache_key(self, prompt, model_name):
        """Génère une clé de cache sémantique pour OpenRouter."""
        raw_str = f"{model_name}:{prompt}".strip().encode('utf-8')
        return hashlib.sha256(raw_str).hexdigest()

    def detect_intent(self, prompt):
        """Analyse simple pour choisir le modèle optimal (Vibration NIV)."""
        p = prompt.lower()
        
        if any(w in p for w in ["code", "script", "python", "html", "css", "bug", "fix"]):
            return "code"
        if any(w in p for w in ["stratégie", "analyse", "pourquoi", "concept", "structure", "synthèse"]):
            return "noble"
        if any(w in p for w in ["poésie", "histoire", "métaphore", "manifeste", "style"]):
            return "creative"
        
        # Par défaut, on utilise le mode rapide/frugal
        return "fast"

    def query(self, prompt, system_prompt=None, force_model=None, stream=False):
        """Exécute la requête avec routage intelligent."""
        intent = self.detect_intent(prompt)
        model_id = force_model or self.MODELS.get(intent, self.MODELS["fast"])
        cache_key = self._generate_cache_key(prompt, model_id)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://antigravity-brain.web.app",
            "X-Title": "Antigravity Router",
            "X-OpenRouter-Cache-Key": cache_key, # Activation du cache sémantique
            "Content-Type": "application/json"
        }

        # Si le modèle est Mercury-2, on peut passer par l'API Inception pour plus de vélocité
        if model_id == "mercury-2" and self.mercury_api_key:
            url = "https://api.inceptionlabs.ai/v1/chat/completions"
            headers["Authorization"] = f"Bearer {self.mercury_api_key}"
        else:
            url = "https://openrouter.ai/api/v1/chat/completions"

        payload = {
            "model": model_id,
            "messages": [],
            "temperature": 0.7
        }

        if system_prompt:
            payload["messages"].append({"role": "system", "content": system_prompt})
        
        payload["messages"].append({"role": "user", "content": prompt})

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            
            # Injection de métadonnées pour le monitoring
            result = {
                "content": data['choices'][0]['message']['content'],
                "model": model_id,
                "intent": intent,
                "cached": response.headers.get("X-OpenRouter-Cache-Status") == "HIT",
                "usage": data.get("usage", {})
            }
            return result
        except Exception as e:
            return {"error": str(e), "model": model_id}

if __name__ == "__main__":
    # Test Rapide
    router = AntigravityRouter()
    test_prompt = "Explique-moi la différence entre le chaos et la jubilation."
    print(f"🚀 Test du Router avec intent 'noble'...")
    res = router.query(test_prompt)
    print(f"--- RÉPONSE ({res['model']}) ---")
    print(res['content'][:300] + "...")
    print(f"Intention détectée : {res['intent']}")
    print(f"Cache Stat : {'HIT' if res['cached'] else 'MISS'}")
