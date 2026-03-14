"""
Tests pour SemanticCompressor
Exécuter: python -m pytest tests/test_semantic_compressor.py -v
"""

import pytest
import sys
from pathlib import Path

# Ajouter le repo root au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.semantic_compressor import SemanticCompressor


class TestSemanticCompressor:
    """Suite de tests pour SemanticCompressor"""

    @pytest.fixture
    def compressor(self):
        return SemanticCompressor(compression_ratio=0.7, diversity_weight=0.5)

    @pytest.fixture
    def sample_chunks(self):
        return [
            "Machine learning is a subset of artificial intelligence.",
            "AI is transforming the world.",
            "Deep learning uses neural networks.",
            "Neural networks are inspired by the brain.",
            "Artificial intelligence includes machine learning.",
            "The brain has billions of neurons.",
            "Machine learning algorithms learn from data.",
            "Neural networks can solve complex problems.",
        ]

    def test_estimate_similarity(self, compressor):
        """Vérifie l'estimation de similarité"""
        chunk1 = "machine learning is great"
        chunk2 = "machine learning is awesome"
        similarity = compressor.estimate_similarity(chunk1, chunk2)

        assert 0 <= similarity <= 1
        assert similarity > 0.5  # Should have high overlap

    def test_estimate_similarity_no_overlap(self, compressor):
        """Vérifie similarité entre chunks sans overlap"""
        chunk1 = "machine learning"
        chunk2 = "zebra giraffe"
        similarity = compressor.estimate_similarity(chunk1, chunk2)

        assert similarity == 0.0

    def test_calculate_relevance_scores(self, compressor, sample_chunks):
        """Vérifie le calcul des scores de pertinence"""
        query = "machine learning"
        scores = compressor.calculate_relevance_scores(sample_chunks, query)

        assert len(scores) == len(sample_chunks)
        assert all(0 <= score <= 1 for score in scores)
        # Chunks contenant "machine learning" doivent avoir des scores plus élevés
        assert scores[0] > 0  # "Machine learning is a subset..."

    def test_calculate_redundancy(self, compressor):
        """Vérifie le calcul de redondance"""
        chunk = "machine learning algorithms"
        selected = [
            "machine learning is great",
            "deep learning uses algorithms",
        ]

        redundancy = compressor.calculate_redundancy(chunk, selected)

        assert 0 <= redundancy <= 1
        assert redundancy > 0  # Should have some overlap

    def test_mmr_selection_reduces_chunks(self, compressor, sample_chunks):
        """Vérifie que MMR réduit le nombre de chunks"""
        query = "machine learning"
        selected, stats = compressor.mmr_selection(sample_chunks, query, k=5)

        assert len(selected) == 5
        assert len(selected) < len(sample_chunks)
        assert stats["compression_percent"] > 0

    def test_compress_with_ratio(self, compressor, sample_chunks):
        """Vérifie compression avec ratio"""
        query = "machine learning"
        selected, stats = compressor.compress(sample_chunks, query)

        expected_count = int(len(sample_chunks) * 0.7)
        assert len(selected) <= expected_count + 1  # +1 pour arrondi

    def test_compress_empty_chunks(self, compressor):
        """Vérifie comportement avec chunks vides"""
        selected, stats = compressor.compress([], "query")

        assert len(selected) == 0
        assert stats["original_chunks"] == 0

    def test_mmr_diversity(self, compressor):
        """Vérifie que MMR maintient la diversité"""
        # Chunks très similaires
        chunks = [
            "machine learning",
            "machine learning algorithms",
            "ML algorithms",
            "deep learning",
            "neural networks",
        ]

        query = "machine learning"
        selected, stats = compressor.mmr_selection(chunks, query, k=3)

        # Should select diverse chunks, not all ML-related
        assert len(selected) == 3
        # La diversité devrait être représentée
        assert "neural networks" in selected or "deep learning" in selected

    def test_compression_ratio_effect(self):
        """Vérifie l'effet du ratio de compression"""
        chunks = ["chunk"] * 10
        query = "test"

        # Ratio 0.5 = garder 50%
        compressor1 = SemanticCompressor(compression_ratio=0.5)
        selected1, stats1 = compressor1.compress(chunks, query)

        # Ratio 0.8 = garder 80%
        compressor2 = SemanticCompressor(compression_ratio=0.8)
        selected2, stats2 = compressor2.compress(chunks, query)

        assert len(selected1) < len(selected2)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])