import re
import os
import json

def audit(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        head_match = re.search(r'<head>(.*?)</head>', content, re.S)
        head = head_match.group(1) if head_match else ''
        # Nettoyage des balises HTML dans les titres pour l'audit sémantique
        titles_raw = re.findall(r'<h[12](.*?)>(.*?)</h[12]>', content, re.S)
        titles = [re.sub(r'<.*?>', '', t[1]).strip() for t in titles_raw]
        return {'head': head, 'titles': titles}
    except Exception as e:
        return {'error': str(e)}

def run_seo_audit():
    base_path = 'c:/Users/JP/Documents/GitHub/site-web-kleia-up/'
    files = ['index.html', 'entreprises.html', 'particuliers.html']
    results = {}
    for f in files:
        results[f] = audit(os.path.join(base_path, f))
    
    output_path = 'c:/Users/JP/Documents/GitHub/antigravity-brain/tmp/seo_audit.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"Audit sauvegardé dans {output_path}")

if __name__ == "__main__":
    run_seo_audit()
