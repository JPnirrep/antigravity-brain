import os
import io
import time
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# CONFIGURATION
# ID du dossier partagé : 1BIIqy09cBrUGb-C0aBq7IVVklGQRvytv
DRIVE_FOLDER_ID = "1BIIqy09cBrUGb-C0aBq7IVVklGQRvytv"
LOCAL_KNOWLEDGE_DIR = "../knowledge/drive_sync/"
CREDENTIALS_FILE = "serviceAccountKey_drive.json" # À créer pour l'accès Drive

def get_drive_service():
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"❌ {CREDENTIALS_FILE} manquant. Impossible de lancer le collecteur.")
        return None
    
    scopes = ['https://www.googleapis.com/auth/drive.readonly']
    creds = service_account.Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scopes)
    return build('drive', 'v3', credentials=creds)

def collect_noble_substance():
    service = get_drive_service()
    if not service: return

    print(f"🦅 [DRIVE VULTURE] Scan du dossier {DRIVE_FOLDER_ID}...")
    
    query = f"'{DRIVE_FOLDER_ID}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name, mimeType)").execute()
    items = results.get('files', [])

    if not items:
        print("📭 Aucun fichier trouvé.")
        return

    os.makedirs(LOCAL_KNOWLEDGE_DIR, exist_ok=True)

    for item in items:
        file_name = item['name']
        file_id = item['id']
        mime_type = item['mimeType']

        # On ne traite que les Google Docs pour l'instant (export MD natif)
        if mime_type == 'application/vnd.google-apps.document':
            print(f"🧱 Extraction de : {file_name}...")
            
            request = service.files().export_media(fileId=file_id, mimeType='text/markdown')
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            with open(os.path.join(LOCAL_KNOWLEDGE_DIR, f"{file_name}.md"), "wb") as f:
                f.write(fh.getvalue())
            
            print(f"✅ Sauvegardé localement : {file_name}.md")

if __name__ == "__main__":
    collect_noble_substance()
