import os

startup_path = os.path.join(os.environ['APPDATA'], 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup')
target_file = os.path.join(startup_path, 'start_proxy_hidden.vbs')

print(f"Checking for: {target_file}")
if os.path.exists(target_file):
    print("File found. Deleting...")
    os.remove(target_file)
    print("Success: start_proxy_hidden.vbs removed from Startup.")
else:
    print("Info: start_proxy_hidden.vbs was not found in Startup.")
