import os
import requests
import json
from dotenv import load_dotenv

def send_email(subject, body_markdown, to_email=None):
    """
    Envoie un email via l'API Resend.
    """
    # Chargement des clés
    env_paths = [".env", "antigravity_cloud/functions/.env"]
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            break
    
    api_key = os.getenv("RESEND_API_KEY")
    if not to_email:
        to_email = os.getenv("USER_EMAIL", "jpp180866@gmail.com")

    if not api_key:
        print("❌ Erreur : RESEND_API_KEY non trouvée.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Nettoyage et conversion basique du Markdown en HTML propre
    import re
    
    # Conversion des headers
    html_body = body_markdown
    html_body = re.sub(r'^# (.*)', r'<h1 style="color: #1a2a6c; border-bottom: 2px solid #1a2a6c; padding-bottom: 10px;">\1</h1>', html_body, flags=re.M)
    html_body = re.sub(r'^## (.*)', r'<h2 style="color: #b21f1f; margin-top: 25px;">\1</h2>', html_body, flags=re.M)
    html_body = re.sub(r'^### (.*)', r'<h3 style="color: #fdbb2d;">\1</h3>', html_body, flags=re.M)
    
    # Conversion du gras (uniquement ce qui est entre **)
    html_body = re.sub(r'\*\*(.*?)\*\*', r'<b style="color: #2c3e50;">\1</b>', html_body)
    
    # Conversion des listes
    html_body = re.sub(r'^- (.*)', r'<li style="margin-left: 20px;">\1</li>', html_body, flags=re.M)
    
    # Conversion des tableaux simplifiée (fallback lisible sans colonnes brutes)
    html_body = re.sub(r'\|', ' ', html_body) # On enlève les barres de tableau qui polluent
    html_body = re.sub(r'^-+.*', '', html_body, flags=re.M) # On enlève les lignes de séparation ---|---|---
    
    # Sauts de ligne
    html_body = html_body.replace("\n", "<br>")

    payload = {
        "from": "Antigravity Brain <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "html": f"""
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; font-size: 11pt; max-width: 800px; margin: auto; padding: 25px; border: 1px solid #ddd; border-radius: 10px; background-color: #fdfdfd;">
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d); border-radius: 8px;">
                <span style="font-size: 2em; font-weight: bold; color: #ffffff; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">🧠 ANTIGRAVITY <b>INTELLIGENCE</b></span>
            </div>
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; border-left: 5px solid #1a2a6c;">
                {html_body}
            </div>
            <hr style="margin-top: 40px; border: 0; border-top: 2px solid #eee;">
            <p style="font-size: 0.9em; color: #7f8c8d; text-align: center;">
                Ce brief a été conçu pour ton <b>écologie mentale</b> avec soin.<br>
                Amitiés, ton équipe Intelligence.
            </p>
        </div>
        """
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"📧 Email envoyé avec succès à {to_email} !")
        return True
    except Exception as e:
        print(f"❌ Erreur d'envoi d'email : {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Détails : {e.response.text}")
        return False

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # Test avec un fichier
        file_path = sys.argv[1]
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        send_email("Simulation Rituel : Leadership", content)
    else:
        send_email("Test Antigravity", "Ceci est un test de connexion du module Messenger.")
