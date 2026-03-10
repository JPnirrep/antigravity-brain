# Protocole d'Auto-Apprentissage : Extraction de Substance

Pour devenir plus autonomes et efficaces, les agents extraient la "substance" de chaque tâche terminée.

## Processus d'Extraction
À la fin de chaque tâche (EXECUTION -> VERIFICATION), l'agent doit se poser ces questions :
1. "Qu'ai-je appris de nouveau sur cette architecture ?"
2. "Quel bug ou piège spécifique a été évité ?"
3. "Quelle optimisation de code (CSS/JS) est désormais un nouveau standard pour nous ?"

## Format des Briques (`knowledge/bricks/`)
Chaque brique doit être un fichier Markdown nommé `YYYY-MM-DD_titre_concis.md` :
- **Titre** : La connaissance extraite.
- **Contexte** : Le projet concerné (ex: KLEIA-UP).
- **Substance** : Le code snippet ou la règle logique apprise.
- **Référence** : Lien vers le fichier modifié.

## Consolidation (Pillars)
Tous les 10 briques, l'Orchestrateur fusionne les connaissances dans les fichiers de Skills (`.agents/skills/`) pour maintenir la frugalité.
