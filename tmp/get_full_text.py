import json
import os

def display_full_synthesis():
    file_path = 'tmp/messages_1330.json'
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r', encoding='utf-16') as f:
        data = json.load(f)
    
    found = False
    for m in data:
        if 'configuration optimale' in m['content'].lower() and m['role'] == 'user':
            found = True
        elif found and m['role'] == 'assistant':
            print(m['content'])
            break

if __name__ == "__main__":
    display_full_synthesis()
