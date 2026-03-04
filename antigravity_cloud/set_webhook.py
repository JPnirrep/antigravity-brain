import requests
import sys

TOKEN = "8696246782:AAE5DpdwrLgBZF6S8M5o6MMhlyrJ6n6OvYM"
URL = "https://us-central1-antigravity-brain-79792.cloudfunctions.net/antigravityBot"

webhook_url = f"https://api.telegram.org/bot{TOKEN}/setWebhook?url={URL}"

response = requests.get(webhook_url)
print(response.json())
