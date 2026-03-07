# 🧱 Brique de Substance : Optimisation Budget OpenRouter
**Date :** 2026-03-06
**Source :** Analyse Guide OpenRouter

## 📉 Stratégies de réduction de coût (jusqu'à -50%)

1.  **Routage Intelligent** : 
    *   Utiliser **Mistral-7B** (ultra-low cost) pour les tâches simples (FAQ, classification).
    *   Réserver **Mercury-2 / GPT-4** pour le raisonnement profond et le code.
2.  **Caching Sémantique** :
    *   Utiliser le header `X-OpenRouter-Cache-Key` (hash SHA-256 du prompt) pour ne pas être facturé sur les répétitions.
3.  **Batching** :
    *   Regrouper jusqu'à 16 requêtes dans un seul appel API pour réduire l'overhead.
4.  **Nettoyage de Prompt** :
    *   Supprimer les tokens inutiles, limiter le *few-shot* (1-2 exemples max).
5.  **Monitoring** :
    *   Alerte à 80% du quota mensuel pour éviter les surprises.

---
*Optimisation clé pour la viabilité économique du système Antigravity.*
