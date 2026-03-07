import requests
import time

URL_WEBHOOK = 'https://antigravitybot-jreyvf3jeq-uc.a.run.app'
TEXT = '''/mode niv

### RECHERCHE DEEP-RESEARCH : AFFIRMATION DE SOI ET INCAPACITE AU REFUS

Analyse neuro, psycho, physio. Tableaux par ages. Mercury-2 focus.'''

payload = {
    'update_id': int(time.time()), # Unique per run
    'message': {
        'chat': {'id': 123862747},
        'text': TEXT
    }
}

print(f"🚀 Envoi du test Deepak Research à {URL_WEBHOOK}...")
try:
    r = requests.post(URL_WEBHOOK, json=payload, timeout=240)
    print(f"✅ Status: {r.status_code}")
    print(f"📄 Response: {r.text}")
except Exception as e:
    print(f"❌ Error: {e}")
