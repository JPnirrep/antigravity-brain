import json
import os

def extract():
    with open('tmp/messages_1330.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
    
    found = False
    for m in data:
        if 'configuration optimale' in m['content'].lower() and m['role'] == 'user':
            found = True
        elif found and m['role'] == 'assistant':
            with open('tmp/synthesis_final.md', 'w', encoding='utf-8') as f_out:
                f_out.write(m['content'])
            print("Extraction réussie dans tmp/synthesis_final.md")
            return

if __name__ == "__main__":
    extract()
