import os
import sys
import subprocess

def certify_directory(base_dir):
    print(f"🕵️ Analyse récursive de : {base_dir}")
    python_files = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))
    
    print(f"📄 {len(python_files)} fichiers Python trouvés. Début de la certification...")
    
    for filepath in python_files:
        print(f"\n--- {filepath} ---")
        try:
            # On appelle le registrar pour chaque fichier
            subprocess.run(["python", "scripts/registrar.py", filepath], check=True)
        except Exception as e:
            print(f"❌ Erreur lors de la certification de {filepath}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python certify_dir.py <directory_path>")
        sys.exit(1)
    certify_directory(sys.argv[1])
