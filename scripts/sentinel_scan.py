import ast
import os
import sys

class SentinelAuditor(ast.NodeVisitor):
    def __init__(self, filename):
        self.filename = filename
        self.issues = []
        self.danger_zones = {
            'os.system': 'Exécution de commande système directe',
            'subprocess.Popen': 'Ouverture de sous-processus',
            'subprocess.run': 'Exécution de commande externe',
            'eval': 'Exécution de code dynamique (très dangereux)',
            'exec': 'Exécution de code dynamique (très dangereux)',
            'requests.post': 'Envoi de données vers l\'extérieur',
            'requests.get': 'Téléchargement de données externes',
            'open': 'Accès aux fichiers locaux'
        }

    def visit_Call(self, node):
        func_name = ""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                func_name = f"{node.func.value.id}.{node.func.attr}"
            else:
                func_name = node.func.attr

        if func_name in self.danger_zones:
            self.issues.append(f"⚠️ [Ligne {node.lineno}] {func_name} : {self.danger_zones[func_name]}")
        
        self.generic_visit(node)

def audit_file(filepath):
    if not filepath.endswith('.py'):
        return True, ["Fichier non-Python (pas d'audit statique AST)"]
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())
        
        auditor = SentinelAuditor(filepath)
        auditor.visit(tree)
        
        if auditor.issues:
            return False, auditor.issues
        return True, ["Code propre (aucune fonction critique détectée)"]
    except Exception as e:
        return False, [f"❌ Erreur d'analyse : {str(e)}"]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python sentinel_scan.py <file_path>")
        sys.exit(1)
    
    success, reports = audit_file(sys.argv[1])
    for r in reports:
        print(r)
    sys.exit(0 if success else 1)
