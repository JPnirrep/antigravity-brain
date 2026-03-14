"""
Smart Cache - Cache lock-free avec tracking du budget tokens
Objectif : -20% tokens (éviter requêtes redondantes)
"""

import logging
import time
import hashlib
from typing import Any, Dict, Optional, Callable
from collections import OrderedDict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class SmartCache:
    """
    Cache sémantique avec:
    - LRU (Least Recently Used) eviction
    - TTL (Time-To-Live) par entry
    - Semantic hash (contenu, pas format)
    - Budget tracking atomique
    - Hit/Miss statistics
    """

    def __init__(
        self,
        max_size: int = 1000,
        ttl_seconds: int = 3600,
        budget_tokens_daily: int = 100000,
    ):
        """
        Args:
            max_size: Nombre max d'entries en cache
            ttl_seconds: Time-to-live par entrée (1 heure par défaut)
            budget_tokens_daily: Budget tokens par jour
        """
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.budget_tokens_daily = budget_tokens_daily

        # Tracking
        self.hits = 0
        self.misses = 0
        self.budget_used_today = 0
        self.budget_reset_time = datetime.now()

    def semantic_hash(self, content: str) -> str:
        """
        Crée un hash sémantique du contenu
        (pas sensible aux espaces/formatage)
        """
        # Normaliser: minuscules, supprimer espaces multiples
        normalized = " ".join(content.lower().split())
        return hashlib.sha256(normalized.encode()).hexdigest()

    def _is_expired(self, entry: Dict) -> bool:
        """Vérifie si une entrée a expiré"""
        if entry["expires_at"] is None:
            return False
        return datetime.now() > entry["expires_at"]

    def _evict_lru(self) -> None:
        """Supprime l'entrée la moins récemment utilisée"""
        if self.cache:
            # OrderedDict: first item is least recently used
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
            logger.debug(f"Evicted LRU entry: {oldest_key[:16]}...")

    def _check_budget_reset(self) -> None:
        """Réinitialise le budget s'il y a plus de 24h"""
        now = datetime.now()
        if now - self.budget_reset_time > timedelta(days=1):
            self.budget_used_today = 0
            self.budget_reset_time = now
            logger.info("Daily budget reset")

    def get(self, content: str) -> Optional[Any]:
        """
        Récupère une valeur du cache par contenu

        Returns:
            (value, hit) ou (None, False) si miss/expired
        """
        key = self.semantic_hash(content)

        if key in self.cache:
            entry = self.cache[key]

            # Vérifier expiration
            if self._is_expired(entry):
                del self.cache[key]
                self.misses += 1
                logger.debug(f"Cache hit but expired: {key[:16]}...")
                return None

            # Hit: déplacer à la fin (most recently used)
            self.cache.move_to_end(key)
            self.hits += 1
            logger.debug(f"Cache HIT: {key[:16]}... (hit_ratio: {self.hit_ratio:.1%})")
            return entry["value"]

        self.misses += 1
        logger.debug(f"Cache MISS: {key[:16]}...")
        return None

    def set(
        self, content: str, value: Any, ttl_override: Optional[int] = None
    ) -> None:
        """
        Ajoute/met à jour une entrée du cache

        Args:
            content: Clé sémantique
            value: Valeur à cacher
            ttl_override: TTL custom pour cette entrée
        """
        key = self.semantic_hash(content)
        ttl = ttl_override or self.ttl_seconds

        entry = {
            "value": value,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(seconds=ttl),
        }

        if key in self.cache:
            # Mise à jour: supprimer et ré-ajouter (move to end)
            del self.cache[key]

        self.cache[key] = entry

        # Éviction si dépassement
        if len(self.cache) > self.max_size:
            self._evict_lru()

        logger.debug(f"Cache SET: {key[:16]}... (size: {len(self.cache)}/{self.max_size})")

    def get_or_compute(
        self, content: str, compute_fn: Callable[[], Any], ttl: Optional[int] = None
    ) -> Any:
        """
        Pattern courant: récupérer du cache ou calculer

        Args:
            content: Clé sémantique
            compute_fn: Fonction à appeler si miss
            ttl: TTL custom

        Returns:
            Valeur (du cache ou calculée)
        """
        # Vérifier cache
        cached = self.get(content)
        if cached is not None:
            return cached

        # Calculer
        logger.info(f"Computing value for: {self.semantic_hash(content)[:16]}...")
        result = compute_fn()

        # Cacher
        self.set(content, result, ttl)

        return result

    def track_token_cost(self, tokens_used: int, provider: str = "unknown") -> None:
        """
        Track les tokens utilisés pour le budget

        Args:
            tokens_used: Nombre de tokens consommés
            provider: Fournisseur (pour breakdown)
        """
        self._check_budget_reset()

        self.budget_used_today += tokens_used
        remaining = self.budget_tokens_daily - self.budget_used_today
        percent_used = (self.budget_used_today / self.budget_tokens_daily) * 100

        logger.info(
            f"Token Cost ({provider}): +{tokens_used} tokens "
            f"(Daily: {self.budget_used_today}/{self.budget_tokens_daily}, {percent_used:.1f}%)"
        )

        # Alert si > 80%
        if percent_used > 80:
            logger.warning(
                f"⚠️  BUDGET ALERT: {percent_used:.1f}% of daily budget used! "
                f"Remaining: {remaining} tokens"
            )

    def get_budget_status(self) -> Dict:
        """Retourne le statut du budget"""
        self._check_budget_reset()

        remaining = self.budget_tokens_daily - self.budget_used_today
        percent_used = (self.budget_used_today / self.budget_tokens_daily) * 100

        return {
            "used": self.budget_used_today,
            "remaining": remaining,
            "total": self.budget_tokens_daily,
            "percent_used": percent_used,
            "status": "🟢 OK" if percent_used < 80 else "🟡 WARNING" if percent_used < 100 else "🔴 EXCEEDED",
        }

    def get_cache_stats(self) -> Dict:
        """Retourne les stats du cache"""
        total_requests = self.hits + self.misses
        hit_ratio = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio_percent": hit_ratio,
            "size": len(self.cache),
            "max_size": self.max_size,
            "utilization_percent": (len(self.cache) / self.max_size * 100),
        }

    @property
    def hit_ratio(self) -> float:
        """Hit ratio (0-1)"""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    def clear(self) -> None:
        """Vide le cache complètement"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
        logger.info("Cache cleared")


# Demo / Test simple
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    cache = SmartCache(max_size=100, ttl_seconds=60, budget_tokens_daily=10000)

    print("=== SMART CACHE DEMO ===\n")

    # 1. Test cache hits/misses
    print("1. Cache Operations")
    cache.set("query1", {"result": "answer1"})
    cache.set("query2", {"result": "answer2"})

    print(f"Get query1: {cache.get('query1')}")  # HIT
    print(f"Get query3: {cache.get('query3')}")  # MISS
    print(f"Get query1: {cache.get('query1')}")  # HIT

    print(f"\nCache Stats: {cache.get_cache_stats()}\n")

    # 2. Test budget tracking
    print("2. Token Budget Tracking")
    cache.track_token_cost(1000, provider="openrouter")
    cache.track_token_cost(500, provider="gemini")
    cache.track_token_cost(2000, provider="mercury2")

    budget_status = cache.get_budget_status()
    print(f"Budget Status: {budget_status}\n")

    # 3. Test get_or_compute
    print("3. Get or Compute Pattern")

    def expensive_computation():
        logger.info("Doing expensive computation...")
        return {"data": "expensive_result"}

    result1 = cache.get_or_compute("expensive_key", expensive_computation)
    print(f"First call (computed): {result1}")

    result2 = cache.get_or_compute("expensive_key", expensive_computation)
    print(f"Second call (cached): {result2}")

    print(f"\nFinal Cache Stats: {cache.get_cache_stats()}")