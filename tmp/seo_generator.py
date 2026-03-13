from scripts.router import AntigravityRouter
import json

def generate_seo_strategy():
    router = AntigravityRouter()
    prompt = """TU ES L'ARCHITECTE SEO (NIV). 
Objectif : Générer la matrice SEO pour l'écosystème KLEIA-UP.

Pages à traiter :
1. index.html (Global Branding / Point d'entrée) : Doit capturer l'essence de "Incarne ton autorité naturelle".
2. entreprises.html (B2B / Direction / DRH) : Focus sur l'engagement collectif et la puissance du chaos organisé.
3. individuel-groupe.html (B2C / Entrepreneurs HSP/HPI) : Focus sur la sortie de l'invisibilité et la parole scénique.

Contraintes Stylistiques :
- Évite les termes génériques (expert, bienveillant, solution).
- Utilise la vibration : Souveraineté, Alchimie, Substance, Jubilation.
- Les Descriptions doivent être des appels à l'action provocateurs d'élan.

Format de sortie attendu (JSON STRICT) :
{
  "index": {
    "title": "...",
    "description": "...",
    "keywords_lsi": "...",
    "og_description": "..."
  },
  "entreprises": {
    "title": "...",
    "description": "...",
    "keywords_lsi": "...",
    "og_description": "..."
  },
  "b2c": {
    "title": "...",
    "description": "...",
    "keywords_lsi": "...",
    "og_description": "..."
  }
}
"""
    try:
        res = router.query(prompt, force_model='mercury-2')
        # On va essayer d'extraire le JSON du texte si Mercury-2 bavarde trop
        content = res.get('content', '')
        # Simple extraction de bloc JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = content[start:end]
            with open('tmp/seo_strategy.json', 'w', encoding='utf-8') as f:
                f.write(json_str)
            print("Stratégie SEO générée avec succès dans tmp/seo_strategy.json")
        else:
            print("Erreur : Pas de JSON trouvé dans la réponse.")
            print(content)
    except Exception as e:
        print(f"Erreur fatale : {e}")

if __name__ == "__main__":
    generate_seo_strategy()
