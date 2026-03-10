# Exemple de Sprint Parallèle : Hub "Second Cerveau" KLEIA-UP

Ce document simule une orchestration parallèle pour la création d'une nouvelle section sur le site KLEIA.

## Orchestration (Plan de Sprint)
**Objectif** : Ajouter une page "Second Cerveau" interactive.
**Agents Mobiles (Parallèle)** :
1. **Agent UI/UX (Mercury Prompt)** : Design de la grille de briques.
2. **Agent Content (Mercury Prompt)** : Rédaction des textes "Substance".
3. **Agent Logic (Mercury Prompt)** : Script JSON-LD et SEO dynamique.

## Simulation des Prompts Mercury 2 délégués

### Sprint Agent 1 (UI/UX)
```text
ROLE: Expert Product Designer (KLEIA Guidelines)
TASK: Créer le layout responsive pour la grille de briques de savoir.
STEPS:
1. Analyser `index.css` de KLEIA.
2. Proposer un composant `.substance-grid` (CSS Vanilla).
3. Ajouter micro-animations au hover.
OUTPUT: CSS unifié.
CRITIQUE: Vérifier accessibilité contrastes et vitesse chargement.
```

### Sprint Agent 2 (Content)
```text
ROLE: Rédacteur Stratégique (Ton NIV)
TASK: Rédiger 3 cartes de "Substance" pour le Second Cerveau.
STEPS:
1. Synthétiser les concepts "Chaos & Jubilation".
2. Structurer en Markdown/JSON.
OUTPUT: 3 fichiers .md dans `bricks/`.
CRITIQUE: Ton doit être inspirant mais frugal.
```

## Synchronisation (Brain Activity)
Les Agents écrivent dans `brain/active_sprints/`. L'orchestrateur fusionne ensuite le CSS de l'Agent 1 avec le contenu de l'Agent 2 dans la page finale via un script d'intégration.

## Extraction de Substance (Auto-apprentissage)
**Substance extraite** : "Le pattern de micro-animation `glassmorphism` sur les cartes de savoir a été optimisé pour Hostinger (poids CSS réduit de 15%)." -> Ajouté au Skill `KLEIA_Hostinger`.
