import sys
import os
import json
sys.path.append(os.getcwd())
from scripts.router import AntigravityRouter

def generate_niv_seo():
    router = AntigravityRouter()
    prompt = """Génère la matrice SEO pour KLEIA-UP.
TON : Souverain, Percutant, Alchimique.
CONCEPT : Leadership Organique et Prise de Parole Incarnee.

Pages :
1. index : Incarne ton autorité naturelle.
2. entreprises : Déclenche l'élan collectif.
3. b2c : Sors de l'invisibilité (Profils HSP/HPI).

FORMAT : JSON STRICT avec title, description (max 160), keywords_lsi (virgules).
"""
    res = router.query(prompt)
    content = res.get('content', '')
    # Extraction propre du JSON
    start = content.find('{')
    end = content.rfind('}') + 1
    if start != -1 and end != -1:
        with open('tmp/seo_strategy_niv.json', 'w', encoding='utf-8') as f:
            f.write(content[start:end])
        print("✅ Matrice SEO NIV générée.")
    else:
        print("❌ Échec de génération JSON.")

if __name__ == "__main__":
    generate_niv_seo()
