# 📋 Prérequis : Déploiement Antigravity v3.0

Pour entamer la phase de déploiement souverain sur votre infrastructure, voici les éléments dont nous aurons besoin. 

---

## 🏗️ 1. Infrastructure (Hetzner)
*   **Compte Hetzner Cloud** : Un accès au panel [Hetzner Cloud](https://console.hetzner.cloud/).
*   **Serveur (Instance)** : Une instance **CPX11** (minimum) ou **CPX21** (recommandé pour AFFiNE) sous **Ubuntu 22.04 LTS**.
*   **Accès SSH** : Une paire de clés SSH configurée pour l'accès root/utilisateur.

## 🌐 2. Réseau & Domaine
*   **Sous-domaine** : Un sous-domaine dédié (ex: `affine.ton-domaine.com`) pointant vers l'IP de votre VPS.
*   **Accès DNS** : Pouvoir ajouter un enregistrement `A` sur votre gestionnaire de domaine (Hostinger, Cloudflare, etc.).

## 🔑 3. Intelligence & APIs
*   **OpenRouter API Key** : Déjà en notre possession, mais à re-vérifier si les quotas sont suffisants.
*   **Anthropic API Key** : Nécessaire pour les fonctions natives de NanoClaw (Claude Agent SDK).
*   **Google Cloud Console** : Accès pour créer/récupérer les identifiants OAuth2 pour **Google Tasks**.

## 🤖 4. Orchestration
*   **Telegram Bot Token** : Nous utiliserons le token existant de votre bot Antigravity.
*   **Fichiers de Substance** : Une archive (ou accès Git) de vos "Bricks" actuelles pour l'ingestion initiale dans AFFiNE.

---

> [!TIP]
> **Le secret de la fluidité** : Si vous avez le VPS déjà provisionné et le sous-domaine prêt avant notre prochaine session, nous pourrons passer directement à l'installation des outils (Phase 2 & 3).
