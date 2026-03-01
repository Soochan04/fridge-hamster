import json
import urllib.request
import urllib.error
import os
import sys

# Force UTF-8 output to fix Windows console printing issues
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Parse .env file manually to avoid external dependencies
env_path = '.env'
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v

api_key = os.environ.get('OPENROUTER_API_KEY')
if not api_key:
    print("API Key not found in .env")
    exit(1)

def test_text_model():
    print("=========================================")
    print("Testing Text Model (arcee-ai/trinity-large-preview:free)...")
    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        data=json.dumps({
            "model": "arcee-ai/trinity-large-preview:free",
            "messages": [{"role": "user", "content": "Hello! Please reply with a short greeting in Korean."}]
        }).encode('utf-8')
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("Response:", result['choices'][0]['message']['content'])
    except urllib.error.URLError as e:
        print("Error:", e)
        if hasattr(e, 'read'):
            print("Details:", e.read().decode('utf-8'))

def test_image_model():
    print("\n=========================================")
    print("Testing Image Model (google/gemma-3-27b-it:free)...")
    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        data=json.dumps({
            "model": "google/gemma-3-27b-it:free",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image? Please describe it shortly in Korean. If this model does not support images, just say so."},
                    {"type": "image_url", "image_url": {"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"}}
                ]
            }]
        }).encode('utf-8')
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("Response:", result['choices'][0]['message']['content'])
    except urllib.error.URLError as e:
        print("Error:", e)
        if hasattr(e, 'read'):
            print("Details:", e.read().decode('utf-8'))
    except Exception as e:
        print("Unexpected error:", e)

if __name__ == "__main__":
    test_text_model()
    test_image_model()
