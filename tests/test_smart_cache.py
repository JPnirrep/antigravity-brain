"""
Tests pour SmartCache
Exécuter: python -m pytest tests/test_smart_cache.py -v
"""

import pytest
import time
import sys
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.smart_cache import SmartCache


class TestSmartCache:
    """Suite de tests pour SmartCache"""

    @pytest.fixture
    def cache(self):
        return SmartCache(max_size=100, ttl_seconds=60, budget_tokens_daily=10000)

    def test_semantic_hash_consistent(self, cache):
        """Vérifie que semantic_hash est consistant"""
        content = "Hello World"
        hash1 = cache.semantic_hash(content)
        hash2 = cache.semantic_hash(content)
        assert hash1 == hash2

    def test_semantic_hash_normalized(self, cache):
        """Vérifie la normalisation du hash"""
        content1 = "Hello World"
        content2 = "hello world"
        content3 = "hello   world"  # Espaces multiples

        hash1 = cache.semantic_hash(content1)
        hash2 = cache.semantic_hash(content2)
        hash3 = cache.semantic_hash(content3)

        # Tous devraient être identiques
        assert hash1 == hash2 == hash3

    def test_set_and_get(self, cache):
        """Vérifie set/get basique"""
        cache.set("key1", "value1")
        result = cache.get("key1")
        assert result == "value1"

    def test_cache_hit(self, cache):
        """Vérifie que cache.get() incrémente les hits"""
        cache.set("key1", "value1")
        cache.get("key1")

        stats = cache.get_cache_stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 0

    def test_cache_miss(self, cache):
        """Vérifie que cache.get() inexistant incrémente les misses"""
        result = cache.get("nonexistent")

        assert result is None
        stats = cache.get_cache_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 1

    def test_hit_ratio(self, cache):
        """Vérifie le calcul du hit ratio"""
        cache.set("key1", "value1")
        cache.get("key1")  # Hit
        cache.get("key1")  # Hit
        cache.get("nonexistent")  # Miss

        assert cache.hit_ratio == 2 / 3

    def test_lru_eviction(self, cache):
        """Vérifie l'éviction LRU"""
        small_cache = SmartCache(max_size=3)

        small_cache.set("key1", "value1")
        small_cache.set("key2", "value2")
        small_cache.set("key3", "value3")

        # Cache est plein, ajouter une 4e clé doit évincer la 1ère
        small_cache.set("key4", "value4")

        # key1 devrait être évincée
        assert small_cache.get("key1") is None
        assert small_cache.get("key4") == "value4"

    def test_ttl_expiration(self, cache):
        """Vérifie l'expiration TTL"""
        short_ttl_cache = SmartCache(max_size=100, ttl_seconds=1)

        short_ttl_cache.set("key1", "value1")
        assert short_ttl_cache.get("key1") == "value1"  # Hit

        time.sleep(1.1)  # Attendre expiration

        assert short_ttl_cache.get("key1") is None  # Expired

    def test_budget_tracking(self, cache):
        """Vérifie le tracking du budget"""
        cache.track_token_cost(1000)
        cache.track_token_cost(2000)

        budget = cache.get_budget_status()
        assert budget["used"] == 3000
        assert budget["remaining"] == 7000
        assert budget["percent_used"] == 30.0

    def test_budget_alert(self, cache):
        """Vérifie l'alerte de budget (80%)"""
        cache.budget_tokens_daily = 1000
        cache.track_token_cost(850)  # 85% du budget

        budget = cache.get_budget_status()
        assert budget["percent_used"] > 80
        assert "WARNING" in budget["status"]

    def test_get_or_compute_hit(self, cache):
        """Vérifie get_or_compute avec cache hit"""
        call_count = 0

        def compute():
            nonlocal call_count
            call_count += 1
            return "computed"

        # Premier appel: computes
        result1 = cache.get_or_compute("key1", compute)
        assert result1 == "computed"
        assert call_count == 1

        # Deuxième appel: from cache
        result2 = cache.get_or_compute("key1", compute)
        assert result2 == "computed"
        assert call_count == 1  # Pas d'appel supplémentaire

    def test_get_or_compute_miss(self, cache):
        """Vérifie get_or_compute avec cache miss"""
        result = cache.get_or_compute("key1", lambda: "value1")
        assert result == "value1"

    def test_clear_cache(self, cache):
        """Vérifie le clear du cache"""
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()

        assert len(cache.cache) == 0
        assert cache.hits == 0
        assert cache.misses == 0

    def test_cache_size_utilization(self, cache):
        """Vérifie le pourcentage d'utilisation du cache"""
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        stats = cache.get_cache_stats()
        assert stats["size"] == 3
        assert stats["utilization_percent"] == 3.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])