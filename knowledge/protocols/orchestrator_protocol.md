# Protocole d'Orchestration Parallèle

L'orchestrateur est le chef d'orchestre des agents Mercury 2. Il gère la concurrence et la synchronisation.

## Workflow de l'Orchestrateur
1. **Analyse** : Décomposer le `USER_REQUEST` en `SUB_TASKS` indépendantes.
2. **Délégation** : Assigner chaque tâche à un agent via le protocole Mercury 2.
3. **Sprints Parallèles** : Lancer l'exécution concurrente (non-linéaire).
4. **Inter-communication** : Utiliser les `Shared Artifacts` (JSON/MD) pour synchroniser l'état.
5. **Intégration** : Fusionner les résultats et vérifier la cohérence.

## Communication Agents (Massa Parallelism)
Les agents ne se parlent pas forcément en direct mais lisent/écrivent sur le "Tableau Noir" (Shared Brain) :
- `brain/active_sprints/agent_[name].json` : État courant et outputs partiels.
- `brain/shared_substance/` : Connaissances extraites utiles aux autres agents.

## Gestion des Dépendances
Si B dépend de A, l'orchestrateur met B en "Wait" jusqu'à ce que l'artifact de A soit validé.
