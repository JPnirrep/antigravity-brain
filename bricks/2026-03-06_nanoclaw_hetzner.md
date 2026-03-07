# 🧱 Brique Technique : NanoClaw & Hetzner VPS
**Date :** 2026-03-06
**Source :** ZDNet / Discussion Bot

## 🚀 NanoClaw (Agent IA Open-Source)
Alternative légère et sécurisée à OpenClaw, optimisée pour le déploiement local (On-Prem).

*   **Modèle :** 1.2B paramètres (Diffusion-LLM).
*   **Avantages :** 100% local, pas de coût d'API, conforme DPA/RGPD.

## 🛠️ Installation sur VPS Hetzner (Ubuntu 22.04)

### 1. Préparer le système
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER && newgrp docker
```

### 2. Déploiement Docker Compose
Créer `docker-compose.yml` :
```yaml
version: "3.9"
services:
  nanoclaw:
    image: ghcr.io/nanoclaw/nanoclaw:latest
    ports: ["8080:8080"]
    volumes: ["nanoclaw_data:/data"]
    environment: ["NANO_MODEL=nanoclaw-1.2b"]
    restart: unless-stopped
volumes:
  nanoclaw_data:
```

### 3. Lancement
```bash
docker-compose up -d
```

## 🧠 Couplage Mémoire
L'indexation FAISS peut être automatisée via un **cron à 14h00** pour rafraîchir la connaissance de l'agent à partir des nouvelles briques de substance.
