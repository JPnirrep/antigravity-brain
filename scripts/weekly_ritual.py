import os
import json
import asyncio
from datetime import datetime
from router import AntigravityRouter
from lifecycle_manager import LifecycleManager

class WeeklyIntelligenceRitual:
    def __init__(self):
        self.router = AntigravityRouter()
        self.lifecycle = LifecycleManager()
        self.output_dir = "intelligence_reports"
        os.makedirs(self.output_dir, exist_ok=True)

    async def verify_link(self, url):
        """Vérifie si une URL est accessible (Code 200)."""
        try:
            import requests # On s'assure qu'il est là
            response = requests.head(url, timeout=5, allow_redirects=True)
            return response.status_code == 200
        except:
            try:
                # Fallback sur un get léger si head échoue
                response = requests.get(url, timeout=5, allow_redirects=True)
                return response.status_code == 200
            except:
                return False

    async def run_ritual(self, task_id, subject):
        print(f"🚀 [SENTINEL] Démarrage du Rituel V6 : {subject}...")
        
        # 1. Analyse de l'intention et vérification du doublon
        is_dup, tid, task = self.lifecycle.check_intent_duplicate(subject)
        if is_dup and tid != task_id:
            print(f"⚠️ Attention : Doublon détecté.")

        # 2. Préparation du prompt V13 - L'ÉQUILIBRE MAÎTRISÉ (Pro & Humain)
        prompt = f"""
        RÔLE : Tes alliés (Dwight, Monica, Ross)
        MISSION : Partage de pépites factuelles et stratégiques pour '{subject}'.
        TON : Humain, "rond", professionnel et sans aucune emphase (pas de pommade sur l'ego).
        STRUCTURE : AUCUNE LISTE NUMÉROTÉE. Rédige un RÉCIT CONTINU (une lettre).
        GREETING : "Coucou Sandrina," (uniquement).
        SIGNATURE : "J'espère que ce point hebdomadaire t'a apporté de la matière pour ta semaine." (uniquement).
        
        CADRE DE RÉDACTION (V13) :
        - INTRODUCTION : Entre directement par "Ce point hebdomadaire te propose de tisser les éléments suivants :"
        - MISE EN PAGE : Utilise le **gras** pour mettre en valeur les **chiffres éloquents** et les **mots essentiels** (ex: performance durable, vérité émotionnelle).
        - EXTRAITS (Sourcing) : Remplace le mot "Snippet" par l'icône 📍. 
        - VERBES : Utilise des verbes précis comme "démontrent" pour l'objectivité, mais garde une fluidité de phrase "ronde".
        
        CONTENU À TISSER :
        - LES FAITS : L'étude Ipsos/Qualisocial 2025 (3000 salariés) et HBR France (mois/année). Inclus l'extrait avec 📍 et le LIEN.
        - LA RÉSONANCE : Fais le lien avec ton Manifeste et ta dernière newsletter (Plexus, l'Âme face à l'IA, héritage 1977-1982).
        - LE LEVIER COM (SEO) : Identifie 5 mots-clés (FR) avec leur indice de résonance (score 0-10) pour ta com de la semaine.
        - LA RESPIRATION : Une citation poétique ou philosophique (Christian Bobin, René Char, Romain Gary, Bergson...). Varie les sources. Traduction en français obligatoire. Archive source en lien.
        
        CONSIGNES CRITIQUES : 
        - Éradication de la rigologie et de l'homonyme.
        - Zéro invention. Si le lien n'est pas sûr, indique [Vérification en cours].
        """
        
        print("🧠 Consultation du Dispatcher et vérification des sources...")
        res = self.router.query(prompt, force_model="mercury-2")
        
        if "error" in res:
            print(f"❌ Erreur : {res['error']}")
            return

        report_content = res['content']
        
        # 3. [SENTINEL] Scan et filtration des liens (Double Sécurité)
        import re
        urls = re.findall(r'(https?://[^\s\)]+)', report_content)
        for url in urls:
            clean_url = url.rstrip('.,')
            is_valid = await self.verify_link(clean_url)
            if not is_valid:
                print(f"🚫 Sentinel a bloqué un lien mort : {clean_url}")
                report_content = report_content.replace(url, "[Lien en cours de vérification ou source archivée]")

        # 4. Enregistrement et Livraison
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"{self.output_dir}/report_{task_id}_{date_str}.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        self.lifecycle.register_cron_task(task_id, f"Veille V6 sur {subject}")
        print(f"✅ Rituel V6 terminé. Livraison sécurisée par Sentinel.")
        return report_content

if __name__ == "__main__":
    ritual = WeeklyIntelligenceRitual()
    asyncio.run(ritual.run_ritual("rituel_leadership_neuro", "Leadership Neuro-Émotionnel et Magnétique"))
