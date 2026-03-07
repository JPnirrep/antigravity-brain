# 🛡️ Analyse : Sécurité Mémoire & Maîtrise Budgétaire

Cette analyse répond à l'impératif de contrôle avant le déploiement de l'optimisation v2.0. Elle détaille comment le système protège à la fois la **Substance** et votre **Portefeuille**.

## 1. La Triade de Mémoire : Sécurité des Données

Le système n'est pas un "géant" qui grossit de manière incontrôlée, mais un organisme qui **digère** l'information :

| Palier | Type | Rôle | Consommation Token |
| :--- | :--- | :--- | :--- |
| **P1** | Court Terme | Historique brut (10-12 msgs) | Variable (Faible à Moyen) |
| **P2** | Moyen Terme | **Index JSON** (Synthèse de substance) | **Fixe & Compressé** (~300 tokens) |
| **P3** | Long Terme | **Briques Vectorisées** (Base de connaissance) | **Chirurgical** (Top-3 briques max) |

> [!NOTE]
> **Sécurité** : L'information n'est jamais "coupée" définitivement. Elle est conservée dans Firebase sous forme de "Briques" (Palier 3). Si on a besoin du détail, le vecteur nous y ramène. Si on a besoin de la vision globale, l'Index (Palier 2) suffit.

## 2. Maîtrise Budgétaire : Pourquoi ça ne va pas exploser ?

### 📉 Base de Données (Firestore)
Firestore n'est pas facturé à la taille du disque, mais à l'interaction (lecture/écriture).
- **Quota Gratuit** : 50 000 lectures et 20 000 écritures **PAR JOUR**.
- **Usage Antigravity** : Une session intense génère environ 100-200 lectures. Nous sommes à **0,4% du quota gratuit**. 
- **Risque de coût** : Quasi-nul tant que vous n'avez pas des milliers d'utilisateurs simultanés.

### 📉 Intelligence Artificielle (OpenRouter / Inception)
Le plan d'optimisation v2.0 est un **bouclier budgétaire** :
1. **Vectorisation ($0.02 / 1M tokens)** : Utiliser `text-embedding-3-small` coûte littéralement des centièmes de centimes pour indexer tout votre drive.
2. **LLM Tiering** : 
    - Nous déléguons le "bruit" (tri, routage, résumés) à des modèles ultra-moins chers (Flash-Lite / DeepSeek / Haiku).
    - Nous réservons le budget "Noble" (Mercury-2) uniquement quand la **Substance** le demande.
3. **Le "Token Shaving"** : C'est la fragmentation intelligente. En ne chargeant que le fragment de 200 tokens utile au lieu de 5000 tokens de PDF, nous divisons le coût de chaque message par 25.

## 3. Garde-Fous Techniques
- **Pas de "Boucles Infinies"** : Les triggers (summarization) ont des seuils de caractères minimum pour éviter de s'auto-déclencher sur du bruit.
- **Maintenabilité** : Le code utilise des interfaces TypeScript (`MemoryService`) qui isolent la logique métier. Si un modèle devient trop cher, on change une seule ligne de code sans rien casser.

## ✅ Conclusion de l'Expert
**Le système est conçu pour la "Frugalité par Construction".** 
La fragmentation (KLEIA-UP) et la vectorisation sont vos meilleures alliées : elles empêchent l'agent d'être "amnésique" tout en lui évitant d'être "obèse" et ruineux.
