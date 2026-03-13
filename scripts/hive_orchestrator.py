import asyncio
import json
import os
import sys
import subprocess
from datetime import datetime
from typing import List, Dict

# Chargement du contexte Firebase/OpenRouter pour l'intelligence
try:
    from dotenv import load_dotenv
    load_dotenv("antigravity_cloud/functions/.env")
except:
    pass

class HiveOrchestrator:
    def __init__(self, trust_registry_path="registry/trust_store.json", budget_total=5.00):
        self.trust_registry_path = trust_registry_path
        self.budget_total = budget_total
        self.spent_total = 0.0
        self.db = None
        self._init_firebase()
        with open(trust_registry_path, 'r') as f:
            self.certified_scripts = json.load(f)

    def _init_firebase(self):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            if not firebase_admin._apps:
                env_path = "antigravity_cloud/functions/.env"
                if os.path.exists(env_path):
                    from dotenv import load_dotenv
                    load_dotenv(env_path)
                sa_info = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
                if sa_info:
                    cred = credentials.Certificate(json.loads(sa_info))
                    firebase_admin.initialize_app(cred)
            self.db = firestore.client()
        except Exception as e:
            print(f"⚠️ Mode local uniquement (Firestore indisponible) : {e}")

    async def atomic_checkout(self, task_id: str, agent_id: str) -> bool:
        """
        Gène 1: Atomic Checkout - Garantit qu'une seule abeille prend la tâche.
        """
        if not self.db: return True # Fallback local
        
        task_ref = self.db.collection("hive_tasks").document(task_id)
        # Transaction Firestore pour garantir l'atomicité
        @firestore.transactional
        def _checkout(transaction, ref):
            snapshot = ref.get(transaction=transaction)
            if snapshot.exists and snapshot.get("status") == "in_progress":
                return False
            transaction.set(ref, {
                "status": "in_progress",
                "assignee": agent_id,
                "started_at": firestore.SERVER_TIMESTAMP
            }, merge=True)
            return True
        
        return _checkout(self.db.transaction(), task_ref)

    async def execute_bee_task(self, task_name: str, script_path: str, query: str, mode="thin"):
        """
        Phase 3: The Swarm + Gène 3: Context Modes
        """
        task_id = f"task_{hash(task_name) % 10000}"
        agent_id = f"bee_{os.path.basename(script_path)}"
        
        # 1. Atomic Checkout
        if not await self.atomic_checkout(task_id, agent_id):
            print(f"⏭️  [Reine] Tâche {task_name} déjà en cours. Saut.")
            return None

        # 2. Context Stitching (Thin vs Fat)
        context = query if mode == "fat" else f"Task ID: {task_id} | Objective: {task_name}"
        
        print(f"🐝 [Butineuse] Mission contextuelle [{mode}]: {task_name}")
        
        # Exécution via Gatekeeper
        process = await asyncio.create_subprocess_exec(
            sys.executable, "scripts/gatekeeper.py", script_path, context,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, _ = await process.communicate()
        result = stdout.decode().strip()
        
        # 3. Finalisation tâche
        if self.db:
            self.db.collection("hive_tasks").document(task_id).update({"status": "done"})
        
        return result

    async def heartbeat_loop(self, query: str, iterations=1):
        """
        Gène 2: Heartbeat - La ruche se réveille et agit.
        """
        for i in range(iterations):
            print(f"💓 [Heartbeat] Pulsation {i+1}...")
            await self.process_request(query)
            if iterations > 1: await asyncio.sleep(5)

    async def run_sentinel_filter(self, raw_results: List[str]) -> str:
        results = [r for r in raw_results if r]
        print(f"🛡️ [Sentinelle] Filtrage de {len(results)} rapports entrants...")
        return f"🍯 [MIEL FINAL]\n" + "\n---\n".join(results)

    async def process_request(self, query: str):
        tasks = await self.run_scout_analysis(query)
        # On décide du mode de contexte selon la tâche
        execution_plan = []
        for t in tasks:
            path = self.find_best_skill(t['keywords'])
            mode = "fat" if t['role'] == "scout" else "thin"
            execution_plan.append(self.execute_bee_task(t['task'], path, query, mode))
        
        raw_results = await asyncio.gather(*execution_plan)
        final_miel = await self.run_sentinel_filter(raw_results)
        print(final_miel)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python hive_orchestrator.py \"Votre demande complexe\"")
        sys.exit(1)
    
    orchestrator = HiveOrchestrator()
    asyncio.run(orchestrator.process_request(" ".join(sys.argv[1:])))
