"""
Tests pour TokenShaver
Exécuter: python -m pytest tests/test_token_shaver.py -v
"""

import pytest
import sys
from pathlib import Path

# Ajouter le repo root au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.token_shaver import TokenShaver


class TestTokenShaver:
    """Suite de tests pour TokenShaver"""

    @pytest.fixture
    def shaver(self):
        return TokenShaver(max_tokens_budget=800)

    def test_estimate_tokens(self, shaver):
        """Vérifie l'estimation de tokens"""
        text = "Hello world"  # ~3 tokens
        tokens = shaver.estimate_tokens(text)
        assert tokens > 0
        assert tokens <= len(text) // 3

    def test_remove_repetitions(self, shaver):
        """Vérifie la suppression des répétitions"""
        text = "Hello world\nHello world\nGoodbye"
        result = shaver.remove_repetitions(text)
        assert result.count("Hello world") == 1
        assert "Goodbye" in result

    def test_strip_excessive_formatting(self, shaver):
        """Vérifie la suppression du formatage excessif"""
        text = "****Bold****   \n\n\nMultiple\n\n\nNewlines"
        result = shaver.strip_excessive_formatting(text)
        assert "****" not in result
        assert "\n\n\n" not in result

    def test_compress_examples(self, shaver):
        """Vérifie la limitation des exemples"""
        text = """
        Example: First example
        Example: Second example
        Example: Third example
        Some content
        """
        result = shaver.compress_examples(text, max_examples=1)
        assert result.count("Example:") == 1

    def test_truncate_long_lists(self, shaver):
        """Vérifie la troncature des listes longues"""
        text = "- Item 1\n- Item 2\n- Item 3\n- Item 4\n- Item 5\n- Item 6"
        result = shaver.truncate_long_lists(text, max_items=3)
        assert result.count("- Item") == 3

    def test_shave_reduces_tokens(self, shaver):
        """Vérifie que shave() réduit bien les tokens"""
        prompt = """
        You are helpful. You are helpful. You are helpful.
        
        Example: something
        Example: another thing
        Example: yet another
        
        - Point 1
        - Point 2
        - Point 3
        - Point 4
        - Point 5
        - Point 6
        """
        shaved, stats = shaver.shave(prompt)

        assert stats["shaved_tokens"] < stats["original_tokens"]
        assert stats["savings_percent"] > 0
        assert len(shaved) < len(prompt)

    def test_shave_preserves_meaning(self, shaver):
        """Vérifie que les réductions ne perdent pas le sens"""
        prompt = "Help me analyze this data. This is important."
        shaved, stats = shaver.shave(prompt)

        # Les mots clés doivent rester
        assert "analyze" in shaved
        assert "data" in shaved


if __name__ == "__main__":
    pytest.main([__file__, "-v"])