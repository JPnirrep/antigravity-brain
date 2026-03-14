import json
import os
from datetime import datetime, timedelta

class LifecycleManager:
    """
    Gère le cycle de vie des tâches, les doublons d'intention et l'archivage de la mémoire.
    """
    def __init__(self, lifecycle_path="brain/registry/tasks_lifecycle.json"):
        self.lifecycle_path = lifecycle_path
        self._ensure_registry()
        self.data = self._load_data()

    def _ensure_registry(self):
        os.makedirs(os.path.dirname(self.lifecycle_path), exist_ok=True)
        if not os.path.exists(self.lifecycle_path):
            with open(self.lifecycle_path, 'w') as f:
                json.dump({"active_cron_tasks": {}, "intent_history": []}, f)

    def _load_data(self):
        with open(self.lifecycle_path, 'r') as f:
            return json.load(f)

    def _save_data(self):
        with open(self.lifecycle_path, 'w') as f:
            json.dump(self.data, f, indent=4)

    def check_intent_duplicate(self, new_intent_summary):
        """
        Garde-fou : Vérifie si une intention similaire a déjà été formulée.
        """
        for task_id, task in self.data["active_cron_tasks"].items():
            if new_intent_summary.lower() in task["description"].lower():
                return True, task_id, task
        return False, None, None

    def register_cron_task(self, task_id, description, frequency="weekly", valid_until_months=6):
        """
        Enregistre un nouveau rituel avec une date de validité.
        """
        start_date = datetime.now()
        end_date = start_date + timedelta(days=30 * valid_until_months)
        
        self.data["active_cron_tasks"][task_id] = {
            "description": description,
            "frequency": frequency,
            "created_at": start_date.isoformat(),
            "valid_until": end_date.isoformat(),
            "status": "active",
            "last_run": None
        }
        self._save_data()
        return f"✅ Tâche '{task_id}' enregistrée. Valide jusqu'au {end_date.strftime('%d/%m/%Y')}."

    def audit_expired_tasks(self):
        """
        Vérifie les tâches arrivant à expiration pour proposer une action.
        """
        now = datetime.now()
        expired = []
        for tid, task in self.data["active_cron_tasks"].items():
            if datetime.fromisoformat(task["valid_until"]) < now:
                expired.append(tid)
        return expired

    def compress_old_bricks(self, brick_dir="bricks", archive_dir="brain/archive", age_months=6):
        """
        Déplace les briques anciennes vers l'archive froide.
        """
        cutoff_date = datetime.now() - timedelta(days=30 * age_months)
        archived_count = 0
        
        if not os.path.exists(archive_dir):
            os.makedirs(archive_dir)

        for filename in os.listdir(brick_dir):
            if filename.endswith(".md") and "_" in filename:
                try:
                    date_part = filename.split("_")[0]
                    file_date = datetime.strptime(date_part, "%Y-%m-%d")
                    if file_date < cutoff_date:
                        os.rename(os.path.join(brick_dir, filename), os.path.join(archive_dir, filename))
                        archived_count += 1
                except ValueError:
                    continue
        
        return archived_count

if __name__ == "__main__":
    lm = LifecycleManager()
    # Test simple : Audit
    expired = lm.audit_expired_tasks()
    print(f"Audit des Cron : {len(expired)} tâches expirées.")
    
    # Test Archivage
    archived = lm.compress_old_bricks()
    print(f"Archivage : {archived} briques déplacées vers l'archive froide.")
