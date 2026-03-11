# 🌪️ Dossier de Migration : Antigravity v3.0 (Souveraineté)

Ce document récapitule les étapes finales pour basculer votre intelligence augmentée de Firebase vers votre infrastructure souveraine.

## 🧱 Résumé des Actifs Prêts
- **Infrastructure** : docker-compose.yml (Traefik, Bot, Mongo, AFFiNE).
- **Données** : bricks_to_affine.py pour la migration de la mémoire.

## 🚀 Plan d'Exécution (Séquentiel)

### 1. Préparation VPS (Utilisateur)
- [ ] Provisionner l'instance Hetzner (**CPX11** minimum).
- [ ] Configurer les DNS : `bot.ton-domaine.com` et `wiki.ton-domaine.com`.

### 2. Déploiement Socle (Agent Architecte)
- [ ] Copier le dossier `.agents` et `antigravity_cloud` sur le VPS.
- [ ] Lancer `docker-compose up -d`.

### 3. Migration Mémoire (Agent Stratège)
- [ ] Exécuter `python bricks_to_affine.py` pour peupler le wiki.
- [ ] Vérifier la synchronisation Telegram via les logs.
