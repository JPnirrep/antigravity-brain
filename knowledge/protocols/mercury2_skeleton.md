# Protocole Mercury 2 (Inception Labs)

Ce document définit le standard de "prompting" pour maximiser la vitesse, la précision et le raisonnement agentique.

## Structure du Prompt (Squelette Principal)

```text
ROLE: [Rôle précis et expert, ex: Senior Fullstack Engineer]
TASK: [Objectif clair en 1 phrase MAX]
CONTEXT: [Code/repo pertinent, fichiers clés, <1k tokens]
STEPS:
1. [Étape 1 actionable et mesurable]
2. [Étape 2... (3-5 max)]
EXAMPLES: [1-2 exemples input/output courts]
OUTPUT: [Format STRICT: JSON / Markdown / Code only]
CRITIQUE: 1. Vérifie erreurs logiques/perfs. 2. Teste mentalement. 3. Corrige/améliore.
```

## Règles d'Or
1. **Brièveté** : < 2k tokens initiaux.
2. **Auto-Critique** : Obliger le modèle à itérer seul.
3. **Format Strict** : Éviter le superflu (le "fluff").

## Variantes
### Coding / Refacto
- **Focus** : Bottlenecks, types, tests.
### Planning Agentique
- **Focus** : API/UI/E2E, déploiement granulaire.
### QA / E2E Browser
- **Focus** : Simulation user, assertions, fix patches.
