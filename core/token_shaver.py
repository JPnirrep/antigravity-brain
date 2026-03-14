"""
Token Shaver - Réduit les tokens inutiles d'un prompt
Objectif : -25% tokens without losing semantic meaning
"""

import re
import logging
from typing import Tuple, List, Dict
from collections import Counter

logger = logging.getLogger(__name__)


class TokenShaver:
    """
    Réduit agressivement la taille des prompts en supprimant:
    - Répétitions
    - Formatage inutile
    - Exemples redondants
    - Whitespace excessif
    """

    def __init__(self, max_tokens_budget: int = 800):
        self.max_tokens_budget = max_tokens_budget
        self.stats = {
            "original_tokens": 0,
            "shaved_tokens": 0,
            "savings_percent": 0.0,
        }

    def estimate_tokens(self, text: str) -> int:
        """
        Estimation rapide: ~1 token ≈ 4 caractères
        (Pour tokenization précise, utiliser tiktoken)
        """
        return len(text) // 4

    def remove_repetitions(self, text: str) -> str:
        """Supprime les phrases répétées"""
        lines = text.split("\n")
        seen = set()
        unique_lines = []

        for line in lines:
            line_clean = line.strip()
            if line_clean and line_clean not in seen:
                seen.add(line_clean)
                unique_lines.append(line)
            elif not line_clean:  # Keep empty lines for readability
                unique_lines.append(line)

        return "\n".join(unique_lines)

    def strip_excessive_formatting(self, text: str) -> str:
        """Supprime markdown/formatting inutile"""
        # Remove multiple markdown symbols
        text = re.sub(r"\*{2,}", "**", text)  # ** au lieu de ***
        text = re.sub(r"_{2,}", "__", text)
        text = re.sub(r"#{4,}", "###", text)  # Max ### pour headers

        # Remove excessive whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)  # Max 2 newlines
        text = re.sub(r" {2,}", " ", text)  # Max 1 space

        return text.strip()

    def compress_examples(self, text: str, max_examples: int = 1) -> str:
        """
        Limite les exemples few-shot à N exemples max
        Heuristique: "Example:" ou "e.g.:" indique un exemple
        """
        lines = text.split("\n")
        example_count = 0
        filtered_lines = []

        for line in lines:
            if re.search(r"(example|e\.g\.|for instance):", line, re.IGNORECASE):
                if example_count < max_examples:
                    filtered_lines.append(line)
                    example_count += 1
                # Skip additional examples
            else:
                filtered_lines.append(line)

        return "\n".join(filtered_lines)

    def truncate_long_lists(self, text: str, max_items: int = 5) -> str:
        """
        Si une liste a > max_items, garder que les max_items premiers
        """
        lines = text.split("\n")
        result = []
        list_count = 0
        in_list = False

        for line in lines:
            if re.match(r"^\s*[-*•]\s", line):  # Liste item
                if not in_list:
                    list_count = 1
                    in_list = True
                    result.append(line)
                elif list_count < max_items:
                    list_count += 1
                    result.append(line)
                # else: skip items beyond max_items
            else:
                in_list = False
                result.append(line)

        return "\n".join(result)

    def shave(self, prompt: str) -> Tuple[str, Dict]:
        """
        Pipeline complète de token shaving

        Returns:
            (shaved_prompt, stats_dict)
        """
        original_text = prompt
        original_tokens = self.estimate_tokens(original_text)

        # Pipeline de shaving
        shaved = original_text
        shaved = self.remove_repetitions(shaved)
        shaved = self.strip_excessive_formatting(shaved)
        shaved = self.compress_examples(shaved, max_examples=1)
        shaved = self.truncate_long_lists(shaved, max_items=5)

        shaved_tokens = self.estimate_tokens(shaved)
        savings = original_tokens - shaved_tokens
        savings_percent = (savings / original_tokens * 100) if original_tokens > 0 else 0

        # Update stats
        self.stats = {
            "original_tokens": original_tokens,
            "shaved_tokens": shaved_tokens,
            "savings_percent": savings_percent,
            "savings_absolute": savings,
        }

        logger.info(
            f"Token Shaving: {original_tokens} → {shaved_tokens} "
            f"(-{savings_percent:.1f}%)"
        )

        return shaved, self.stats


# Demo / Test simple
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    shaver = TokenShaver()

    sample_prompt = """
    You are an AI assistant. You are an AI assistant. You are an AI assistant.
    
    ### Instructions
    
    1. Analyze the text
    2. Summarize the text
    3. Provide insights
    
    Example: "Hello world" is a greeting. e.g., "Hi there" is also a greeting.
    Example: "Good morning" is a greeting.
    Example: "Bonjour" is a French greeting.
    
    - Item 1
    - Item 2
    - Item 3
    - Item 4
    - Item 5
    - Item 6
    - Item 7
    """

    shaved, stats = shaver.shave(sample_prompt)
    print("=== ORIGINAL ===")
    print(sample_prompt)
    print("\n=== SHAVED ===")
    print(shaved)
    print(f"\n=== STATS ===")
    print(f"Tokens: {stats['original_tokens']} → {stats['shaved_tokens']}")
    print(f"Savings: {stats['savings_percent']:.1f}%")