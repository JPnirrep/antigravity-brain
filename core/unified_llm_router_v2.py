"""
Unified LLM Router v2 - INTÉGRATION COMPLÈTE
Combine: TokenShaver + SemanticCompressor + SmartCache
"""

import os
import sys
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional, List
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from token_shaver import TokenShaver
from semantic_compressor import SemanticCompressor
from smart_cache import SmartCache

load_dotenv()

logger = logging.getLogger(__name__)


class UnifiedLLMRouterV2:
    """
    Orchestrateur LLM intégré avec optimisations de frugalité
    
    Pipeline:
    1. Check cache (SmartCache)
    2. Compress contexte (SemanticCompressor)
    3. Shave tokens (TokenShaver)
    4. Select provider (Intent-based)
    5. Call LLM
    6. Track cost + Cache result
    """

    def __init__(
        self,
        max_cache_size: int = 1000,
        budget_tokens_daily: int = 100000,
        compression_ratio: float = 0.7,
    ):
        # Modules d'optimisation
        self.token_shaver = TokenShaver(max_tokens_budget=800)
        self.semantic_compressor = SemanticCompressor(compression_ratio=compression_ratio)
        self.smart_cache = SmartCache(
            max_size=max_cache_size,
            ttl_seconds=3600,
            budget_tokens_daily=budget_tokens_daily,
        )

        # Providers
        self.providers = {
            "gemini": self._call_gemini,
            "mercury2": self._call_inception,
            "openrouter": self._call_openrouter,
        }

        # Stats
        self.stats = {
            "total_queries": 0,
            "cache_hits": 0,
            "tokens_saved": 0,
            "cost_saved": 0.0,
        }

        logger.info("UnifiedLLMRouterV2 initialized with full optimization stack")

    def detect_intent(self, query: str) -> str:
        """
        Détecte l'intention de la requête pour router intelligemment
        """
        query_lower = query.lower()

        # Heuristiques simples
        if any(word in query_lower for word in ["code", "implement", "function", "class"]):
            return "coding"
        elif any(word in query_lower for word in ["summarize", "summary", "brief"]):
            return "summarization"
        elif any(word in query_lower for word in ["translate", "french", "spanish"]):
            return "translation"
        else:
            return "general"

    def select_provider(self, intent: str) -> str:
        """
        Sélectionne le meilleur provider selon l'intention
        """
        mapping = {
            "coding": "mercury2",  # Meilleur pour le code
            "summarization": "gemini",  # Rapide + léger
            "translation": "openrouter",  # Bon pour les langues
            "general": "gemini",  # Par défaut
        }
        return mapping.get(intent, "gemini")

    def retrieve_relevant_context(self, query: str) -> List[str]:
        """
        Simule la récupération de contexte via FAISS/vector store
        En production: requête FAISS réelle
        """
        # Mock: retourner des chunks de contexte
        return [
            f"Context chunk 1 for query: {query}",
            f"Context chunk 2 for query: {query}",
            f"Context chunk 3 for query: {query}",
            f"Context chunk 4 related to: {query}",
            f"Context chunk 5 related to: {query}",
        ]

    def optimize_prompt(self, query: str, context_chunks: List[str]) -> Dict:
        """
        Pipeline d'optimisation complet
        """
        # 1. Compresser le contexte
        compressed_chunks, compress_stats = self.semantic_compressor.compress(
            context_chunks, query
        )

        # 2. Assembler le prompt
        context_text = "\n".join(compressed_chunks)
        full_prompt = f"Context:\n{context_text}\n\nQuery: {query}"

        # 3. Shaver les tokens
        shaved_prompt, shave_stats = self.token_shaver.shave(full_prompt)

        return {
            "original_prompt": full_prompt,
            "optimized_prompt": shaved_prompt,
            "compress_stats": compress_stats,
            "shave_stats": shave_stats,
        }

    def query(self, input_data: str) -> Any:
        """
        Query principale avec optimisations complètes
        """
        self.stats["total_queries"] += 1

        logger.info(f"=== Query #{self.stats['total_queries']} ===")
        logger.info(f"Input: {input_data[:100]}...")

        # 1. Check cache
        cached_result = self.smart_cache.get(input_data)
        if cached_result:
            self.stats["cache_hits"] += 1
            logger.info(f"✅ CACHE HIT! (hit ratio: {self.smart_cache.hit_ratio:.1%})")
            return cached_result

        # 2. Retrieve context
        context_chunks = self.retrieve_relevant_context(input_data)

        # 3. Optimize prompt
        optimization_result = self.optimize_prompt(input_data, context_chunks)
        optimized_prompt = optimization_result["optimized_prompt"]

        # 4. Detect intent + select provider
        intent = self.detect_intent(input_data)
        provider = self.select_provider(intent)
        logger.info(f"Intent: {intent} → Provider: {provider}")

        # 5. Call LLM
        start_time = time.time()
        response = self.providers[provider](optimized_prompt)
        latency_ms = (time.time() - start_time) * 1000

        # 6. Track cost
        tokens_used = response.get("tokens_used", 0)
        self.smart_cache.track_token_cost(tokens_used, provider)

        # 7. Calculate savings
        original_tokens = optimization_result["shave_stats"]["original_tokens"]
        saved_tokens = original_tokens - tokens_used
        self.stats["tokens_saved"] += saved_tokens

        # 8. Cache result
        self.smart_cache.set(input_data, response, ttl_override=1800)  # 30 min TTL

        # Log result
        logger.info(f"Response latency: {latency_ms:.1f}ms")
        logger.info(
            f"Tokens: {original_tokens} → {tokens_used} (-{saved_tokens} saved)"
        )

        return response

    def _call_gemini(self, prompt: str) -> Any:
        """Mock: appel Gemini"""
        logger.info("Calling Gemini (mock)")
        return {
            "provider": "gemini",
            "result": f"Gemini response to: {prompt[:50]}...",
            "tokens_used": len(prompt) // 4,
        }

    def _call_inception(self, prompt: str) -> Any:
        """Mock: appel Mercury2"""
        logger.info("Calling Mercury2 (mock)")
        return {
            "provider": "mercury2",
            "result": f"Mercury2 response to: {prompt[:50]}...",
            "tokens_used": len(prompt) // 4,
        }

    def _call_openrouter(self, prompt: str) -> Any:
        """Mock: appel OpenRouter"""
        logger.info("Calling OpenRouter (mock)")
        return {
            "provider": "openrouter",
            "result": f"OpenRouter response to: {prompt[:50]}...",
            "tokens_used": len(prompt) // 4,
        }

    def get_dashboard(self) -> Dict:
        """Retourne un dashboard de monitoring"""
        cache_stats = self.smart_cache.get_cache_stats()
        budget_stats = self.smart_cache.get_budget_status()

        return {
            "overview": {
                "total_queries": self.stats["total_queries"],
                "cache_hits": self.stats["cache_hits"],
                "cache_hit_ratio": f"{cache_stats['hit_ratio_percent']:.1f}%",
            },
            "tokens": {
                "total_saved": self.stats["tokens_saved"],
                "cost_saved_usd": self.stats["tokens_saved"] * 0.001 / 1000,  # Estimation
            },
            "cache": cache_stats,
            "budget": budget_stats,
        }


# Demo
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    router = UnifiedLLMRouterV2(budget_tokens_daily=50000)

    print("\n" + "=" * 80)
    print("UNIFIED LLM ROUTER v2 - FULL OPTIMIZATION STACK")
    print("=" * 80 + "\n")

    # Test 1: Query simple
    print("TEST 1: Simple Query")
    response1 = router.query("Explain machine learning")
    print(f"Response: {response1}\n")

    # Test 2: Query en cache (devrait être hit)
    print("TEST 2: Cached Query")
    response2 = router.query("Explain machine learning")
    print(f"Response: {response2}\n")

    # Test 3: Query différente
    print("TEST 3: Different Query")
    response3 = router.query("Write a Python function")
    print(f"Response: {response3}\n")

    # Dashboard
    print("=" * 80)
    print("DASHBOARD")
    print("=" * 80)
    dashboard = router.get_dashboard()
    print(json.dumps(dashboard, indent=2))