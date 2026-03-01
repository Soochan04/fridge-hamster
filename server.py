import os
import json
import urllib.request
import urllib.error
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()

# Allow all origins so local HTML can call it easily
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat")
async def chat_proxy(request: Request):
    if not API_KEY:
        return JSONResponse(status_code=500, content={"error": "API Key is not set on the server."})

    try:
        data = await request.json()
        
        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:8080',
                'X-Title': 'Fridge Recipe App'
            },
            data=json.dumps(data).encode('utf-8')
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result
            
    except urllib.error.URLError as e:
        error_msg = str(e)
        if hasattr(e, 'read'):
            try:
                error_msg = e.read().decode('utf-8')
            except:
                pass
        return JSONResponse(status_code=500, content={"error": error_msg})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Run on 8080 or another port
    uvicorn.run(app, host="0.0.0.0", port=8080)
