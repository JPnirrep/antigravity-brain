# Plan d'Action : Optimisation "Token-Frugal" Antigravity v2.0

Ce plan vise à transformer les recommandations de l'audit Mercury-2 en actifs technologiques concrets, en respectant la règle de non-bris de code et d'amélioration continue.

## 🛡️ Principes Directeurs
- **Frugalité** : Réduire le coût par échange (tokens d'entrée/sortie).
- **Substance** : Préserver l'intelligence NIV malgré la réduction de contexte.
- **Maintenabilité** : Code modulaire et documenté.

---

## 🚀 Modifications Proposées

### 1. [Component] Knowledge Router (KLEIA-UP)
**Fichier :** `MemoryService.ts`
- **Changement** : Création d'une méthode `getRelevantFragments(query: string)`.
- **Logique** : Au lieu d'injecter tout le module, le router analyse les mots-clés de la query et compare avec `index_map.json`. Il ne charge que le fragment nécessaire (ex: `doc_002` pour le stress).
- **Gain estimé** : -500 à -1500 tokens par appel ciblé.

### 2. [Component] Context Shaving & Memory Management
**Fichiers :** `index.ts`, `MemoryService.ts`
- **Changement** : Implémentation d'une bascule automatique.
- **Logique** : Si `history.length > 10`, le système remplace les messages 1 à 7 par le `indexJSON` (synthèse structurée du Palier 2). Seuls les 3 derniers messages restent en brut pour la fluidité immédiate.
- **Gain estimé** : Réduction linéaire drastique du coût sur les sessions longues.

### 3. [Component] LLM Tiering (OpenRouter Migration)
**Fichiers :** `index.ts`
- **Modèles de remplacement** :
    - **Routing/Fast** : Passer de `gemini-2.0-flash` à `google/gemini-2.0-flash-lite-001` ou `deepseek/deepseek-chat` (encore moins cher).
    - **Summarization** : Remplacer `claude-3-haiku` par `deepseek/deepseek-chat` pour un meilleur rapport qualité/prix sur les gros volumes.
- **Prompt Caching** : Activation des headers de cache pour les blocs statiques `NIV_MANIFESTE`.

### 4. [Component] Nettoyage Logistique
**Fichier :** `MemoryService.ts`
- **Changement** : Filtrage des messages système et logistiques du stockage de l'historique long terme.

---

## 🧪 Plan de Vérification

### Tests Automatisés
- `npm run test:memory` : Vérifier que le chargement des fragments renvoie les bonnes données.
- Script de simulation de session longue pour mesurer la taille des payloads envoyés à OpenRouter.

### Tests Manuels
- Envoyer un message sur le "stress" et vérifier dans les logs Firebase que SEUL le fragment `doc_002` a été mobilisé.

---
> [!IMPORTANT]
> **Sécurité** : Aucune suppression de fonction existante. Les nouvelles méthodes cohabiteront avec les anciennes avant bascule finale.
