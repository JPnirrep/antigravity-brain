# 🗺️ Roadmap Antigravity v3.0 : Déploiement Souverain

Ce plan d'action définit les étapes pour migrer Antigravity d'un système purement Cloud vers une architecture hybride souveraine sur **VPS Hetzner** avec **NanoClaw** et **AFFiNE**.

## ⏱️ Estimation Globale (Méthode Agentique NIV)
*   **Temps total estimé** : 3h30 à 4h30 de travail effectif.
*   **Approche** : Déploiement granulaire par blocs Docker isolés pour garantir la robustesse.

---

## 🏗️ Phase 1 : Forteresse VPS (Hetzner)
*   **Objectif** : Provisionnement et sécurisation.
*   **Tâches** : 
    *   Provisionnement de l'instance (Ubuntu 22.04 LTS).
    *   Durcissement SSH (Clés, désactivation root, firewall UFW).
    *   Installation de l'environnement Docker & Compose.
*   **Estimation** : 45 minutes.

## 🎨 Phase 2 : Le Wiki Visuel (AFFiNE)
*   **Objectif** : Poste de commandement de la connaissance.
*   **Tâches** : 
    *   Déploiement du conteneur `affine-pro` via Docker Compose.
    *   Configuration de la base de données PostgreSQL isolée.
    *   Mise en place d'un reverse proxy (Nginx/Traefik) + SSL (Certbot).
*   **Estimation** : 45 minutes.

## 🚀 Phase 3 : L'Agent Exécutant (NanoClaw)
*   **Objectif** : Le bras armé sur le système.
*   **Tâches** : 
    *   Installation du Claude Agent SDK et de NanoClaw.
    *   Configuration des "Hard Boundaries" (Containers isolés pour l'IA).
    *   Implémentation des premières "Skills" (Sync Bricks -> AFFiNE).
*   **Estimation** : 1 heure 15 minutes.

## 🧠 Phase 4 : Orchestration & Pont Multimodal
*   **Objectif** : Fluidité Telegram <-> NanoClaw <-> Brain.
*   **Tâches** : 
    *   Câblage du Telegram Webhook vers NanoClaw.
    *   Intégration du module d'analyse audio/vidéo (Bridge Gemini Flash).
    *   Test du flux de rappel (Google Tasks API).
*   **Estimation** : 1 heure 30 minutes.

---

## 🛡️ User Review Required
> [!IMPORTANT]
> **Accès VPS** : J'aurai besoin des accès SSH (ou que vous exécutiez les commandes de base) pour initier le déploiement.
> **Domaine** : Possédez-vous un nom de domaine ou un sous-domaine pour l'interface AFFiNE ?

## 🏁 Critères de Succès
1.  **Souveraineté** : 100% des fichiers "Bricks" sont manipulables par NanoClaw sur le VPS.
2.  **Visibilité** : Chaque échange Telegram important génère une page Wiki dans AFFiNE.
3.  **Action** : Un audio envoyé sur Telegram peut générer une tâche Google automatique.
