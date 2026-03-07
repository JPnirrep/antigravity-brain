# 🧱 Brique de Substance : Mémoire Long-Terme (Advent of Agents)
**Date :** 2026-03-06
**Source :** Discussion Telegram / LinkedIn (Shubham Saboo - Day 5)

## 📌 Concept Central
Le protocole de **mémoire à long terme** pour les agents autonomes repose sur un pipeline d'ingestion et de recherche sémantique (RAG). L'objectif est de permettre à l'agent de "se souvenir" de faits passés sans saturer la fenêtre de contexte du LLM.

## 🛠️ Le Protocole en 4 Étapes

1.  **Ingestion & Chunking** : Capture et découpage du contenu en petits blocs (chunks) pour une recherche chirurgicale.
    *   *Outils :* `langchain.document_loaders`, `RecursiveCharacterTextSplitter`.
2.  **Indexation / Embedding** : Conversion des blocs en vecteurs sémantiques.
    *   *Outils :* `OpenAIEmbeddings`, `SentenceTransformers`.
3.  **Vector Store** : Stockage et recherche ultra-rapide par similarité cosinus.
    *   *Outils :* `FAISS`, `Pinecone`, `Milvus`.
4.  **Récupération (RAG)** : Injection des blocs les plus pertinents (Top-K) dans le prompt système au moment de la génération.

## 💡 Pourquoi ça marche ?
*   **Scalabilité** : Des millions de documents indexables.
*   **Pertinence** : Capture la sémantique plutôt que les mots-clés simples.
*   **Isolation** : Le LLM reste léger, la connaissance est externalisée.

---
*Cette brique est destinée à être ré-injectée dans Antigravity Brain pour l'implémentation prévue à 14h.*
