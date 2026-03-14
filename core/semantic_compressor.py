"""
Semantic Compressor - Compresse le contexte via MMR (Maximal Marginal Relevance)
Objectif : -15% tokens without losing semantic diversity
"""

import logging
from typing import List, Tuple, Dict, Optional
import math

logger = logging.getLogger(__name__)


class SemanticCompressor:
    """
    Compresse un ensemble de chunks de contexte en gardant:
    - Les chunks les plus pertinents (similarité avec query)
    - La diversité sémantique (évite la redondance)
    
    Utilise MMR (Maximal Marginal Relevance) pour l'équilibre.
    """

    def __init__(self, compression_ratio: float = 0.7, diversity_weight: float = 0.5):
        """
        Args:
            compression_ratio: Ratio de chunks à garder (0.7 = 70%)
            diversity_weight: Poids de la diversité vs pertinence (0-1)
                             0.0 = pertinence uniquement
                             1.0 = diversité uniquement
        """
        self.compression_ratio = compression_ratio
        self.diversity_weight = diversity_weight
        self.stats = {
            "original_chunks": 0,
            "compressed_chunks": 0,
            "compression_percent": 0.0,
            "redundancy_removed": 0,
        }

    def estimate_similarity(self, chunk1: str, chunk2: str) -> float:
        """
        Estimation simple de similarité par overlap de tokens
        (Pour une vraie implémentation, utiliser embeddings + cosine similarity)
        """
        tokens1 = set(chunk1.lower().split())
        tokens2 = set(chunk2.lower().split())

        if not tokens1 or not tokens2:
            return 0.0

        intersection = len(tokens1 & tokens2)
        union = len(tokens1 | tokens2)

        if union == 0:
            return 0.0

        return intersection / union

    def calculate_relevance_scores(self, chunks: List[str], query: str) -> List[float]:
        """
        Calcule la pertinence de chaque chunk par rapport à la query
        """
        scores = []
        for chunk in chunks:
            similarity = self.estimate_similarity(chunk, query)
            scores.append(similarity)

        return scores

    def calculate_redundancy(self, chunk: str, selected_chunks: List[str]) -> float:
        """
        Calcule la redondance d'un chunk par rapport aux chunks déjà sélectionnés
        Moyenne de la similarité avec tous les chunks sélectionnés
        """
        if not selected_chunks:
            return 0.0

        similarities = [self.estimate_similarity(chunk, sel) for sel in selected_chunks]
        return sum(similarities) / len(similarities)

    def mmr_selection(
        self, chunks: List[str], query: str, k: Optional[int] = None
    ) -> Tuple[List[str], Dict]:
        """
        MMR (Maximal Marginal Relevance) Selection

        Algorithm:
        1. Calculer la pertinence de chaque chunk
        2. Sélectionner itérativement le chunk qui maximise:
           MMR = (1 - lambda) * Relevance - lambda * MaxSimilarity_to_selected
        3. Retourner les k meilleurs chunks

        Args:
            chunks: Liste de chunks à compresser
            query: Query de référence pour la pertinence
            k: Nombre de chunks à garder (si None, utiliser compression_ratio)

        Returns:
            (selected_chunks, stats)
        """
        if not chunks:
            return [], self.stats

        if k is None:
            k = max(1, int(len(chunks) * self.compression_ratio))

        # 1. Calculer pertinence initiale
        relevance_scores = self.calculate_relevance_scores(chunks, query)

        # 2. Sélection itérative MMR
        selected_indices = []
        remaining_indices = list(range(len(chunks)))

        for _ in range(min(k, len(chunks))):
            best_idx = None
            best_mmr = -float("inf")

            for idx in remaining_indices:
                # Pertinence
                relevance = relevance_scores[idx]

                # Redondance (similarité max avec chunks sélectionnés)
                selected_chunks_list = [chunks[i] for i in selected_indices]
                redundancy = self.calculate_redundancy(chunks[idx], selected_chunks_list)

                # MMR score
                mmr = (1 - self.diversity_weight) * relevance - self.diversity_weight * redundancy

                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = idx

            if best_idx is not None:
                selected_indices.append(best_idx)
                remaining_indices.remove(best_idx)

        # 3. Retourner les chunks sélectionnés (dans l'ordre original)
        selected_indices.sort()
        selected_chunks = [chunks[i] for i in selected_indices]

        # 4. Calculer les stats
        compression_percent = (1 - len(selected_chunks) / len(chunks)) * 100 if chunks else 0

        self.stats = {
            "original_chunks": len(chunks),
            "compressed_chunks": len(selected_chunks),
            "compression_percent": compression_percent,
            "redundancy_removed": len(chunks) - len(selected_chunks),
        }

        logger.info(
            f"Semantic Compression: {len(chunks)} → {len(selected_chunks)} "
            f"(-{compression_percent:.1f}%)"
        )

        return selected_chunks, self.stats

    def compress(
        self, chunks: List[str], query: str = ""
    ) -> Tuple[List[str], Dict]:
        """
        Interface publique pour compression
        """
        if not query:
            # Si pas de query, utiliser simplement la pertinence relative
            query = " ".join(chunks[:1]) if chunks else ""

        return self.mmr_selection(chunks, query)


# Demo / Test simple
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    compressor = SemanticCompressor(compression_ratio=0.7, diversity_weight=0.5)

    # Chunks de contexte (simples)
    chunks = [
        "Machine learning is a subset of artificial intelligence.",
        "AI is transforming the world.",
        "Deep learning uses neural networks.",
        "Neural networks are inspired by the brain.",
        "Artificial intelligence includes machine learning.",
        "The brain has billions of neurons.",
        "Machine learning algorithms learn from data.",
        "Neural networks can solve complex problems.",
    ]

    query = "machine learning and artificial intelligence"

    selected, stats = compressor.compress(chunks, query)

    print("=== ORIGINAL CHUNKS ===")
    for i, chunk in enumerate(chunks):
        print(f"{i+1}. {chunk}")

    print("\n=== COMPRESSED CHUNKS ===")
    for i, chunk in enumerate(selected):
        print(f"{i+1}. {chunk}")

    print(f"\n=== STATS ===")
    print(f"Chunks: {stats['original_chunks']} → {stats['compressed_chunks']}")
    print(f"Compression: {stats['compression_percent']:.1f}%")
    print(f"Redundancy removed: {stats['redundancy_removed']} chunks")