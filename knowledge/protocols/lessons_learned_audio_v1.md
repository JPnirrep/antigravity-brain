# 🧠 Substance Brick : Leçons Apprises (Audio & Agents)

**Date** : 2026-03-10
**Sujet** : Migration Transcription Audio vers OpenRouter (Gemini 2.0 Flash)

## 🎯 Victoire Stratégique
Le système de transcription est passé d'une dépendance fragile (Hugging Face endpoints instables) à une intégration multimodale robuste via **OpenRouter**.

## 🛡️ Analyse Post-Mortem (Pour les futurs agents)

### 1. Le Piège des IDs de Modèles
- **Erreur** : Tenter d'utiliser des suffixes non officiels ou obsolètes (ex: `-8k`).
- **Leçon** : Toujours vérifier l'ID exact via un agent de recherche ou un script de diagnostic minimal (Sandbox) avant d'intégrer dans le code principal. OpenRouter est un aggrégateur, ses IDs ne calquent pas toujours ceux de l'original.

### 2. La Dissonance des Formats (MIME Mix-up)
- **Erreur** : Forcer "wav" alors que la source (Telegram) est nativement en "oga" (Ogg Opus).
- **Leçon** : La modalité `input_audio` de Gemini est puissante mais exige une cohérence entre le champ `format` et les données binaires. L'extraction dynamique de l'extension est la seule voie viable.

### 3. La Puissance de Mercury 2
- **Leçon** : En cas d'échec silencieux (400/404), le protocole **Audit Mercury 2** avec script de diagnostic isolé est 10x plus efficace que de modifier le code à l'aveugle. L'isolation permet de voir la réponse brute du provider.

## 🚀 Recommandations pour la Créativité
- **Modèle Cible** : `google/gemini-2.0-flash-001` est le "sweet spot" actuel pour le compromis vitesse / coût / multimodalité.
- **Prochain Pas** : Utiliser cette base stable pour injecter de la *Prosodie* (détection d'émotions vocales) directement dans le prompt système de transcription.

---
*Document généré par l'Agent Antigravity pour la pérennité du Projet.*
