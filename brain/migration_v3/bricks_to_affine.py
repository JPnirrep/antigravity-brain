import os
import requests
import json
from pathlib import Path

AFFINE_URL = os.getenv("AFFINE_URL", "http://localhost:4321/graphql")
BRICKS_DIR = Path("c:/Users/JP/Documents/GitHub/antigravity-brain/bricks")

def upload_to_affine(title, content, tags):
    query = """
    mutation CreatePage($title: String!, $content: String!) {
      createPage(input: { title: $title, content: $content }) {
        id
      }
    }
    """
    variables = {"title": title, "content": content}
    try:
        response = requests.post(AFFINE_URL, json={'query': query, 'variables': variables})
        if response.status_code == 200:
            print(f"✅ Success: {title}")
        else:
            print(f"❌ Error: {title} ({response.status_code})")
    except Exception as e:
        print(f"🔥 Fatal Error: {e}")

def migrate_all_bricks():
    for brick_file in BRICKS_DIR.glob("*.md"):
        if brick_file.name == "index.md": continue
        with open(brick_file, 'r', encoding='utf-8') as f:
            content = f.read()
            title = brick_file.stem.replace("_", " ").title()
            upload_to_affine(title, content, ["Migration_v3"])

if __name__ == "__main__":
    print("🚀 Démarrage de la migration de la Substance vers AFFiNE (v3.0)...")
