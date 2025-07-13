from fastapi import FastAPI, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from google.cloud import firestore
from fastapi.responses import JSONResponse
import numpy as np
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins, or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Firestore client initialization
def initialize_firestore():
    if os.environ.get('ENV') == 'production':
        # In production, use default credentials
        return firestore.Client()
    else:
        # # Use credentials from .env.local
        # project_id = os.environ.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
        # private_key = os.environ.get('NEXT_PUBLIC_FIREBASE_PRIVATE_KEY')
        # client_email = os.environ.get('NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL')
        
        # if not all([project_id, private_key, client_email]):
        #     raise ValueError("Missing required Firebase credentials in .env.local")
            
        # # Handle escaped newlines in private key
        # private_key = private_key.replace('\\n', '\n')
        
        # # Load credentials from environment variables
        # credentials_info = {
        #     "type": "service_account",
        #     "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
        #     "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
        #     "private_key": os.environ.get("FIREBASE_PRIVATE_KEY").replace('\\\\n', '\\n'),
        #     "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
        #     "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
        #     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        #     "token_uri": "https://oauth2.googleapis.com/token",
        # }
        
        credentials = json.loads(os.environ.get('FIREBASE_CREDENTIALS', '{}'))

        return firestore.Client.from_service_account_info(credentials)

db = initialize_firestore()

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

class SearchRequest(BaseModel):
    query: str

@app.post("/api/search-templates")
async def search_templates(req: Request):
    body = await req.json()
    query = body.get('query', '')
    if not query:
        return JSONResponse(status_code=400, content={"error": "Missing query"})

    # Embed the query
    query_emb = model.encode(query).tolist()

    # Fetch all templates
    templates_ref = db.collection('templates')
    docs = templates_ref.stream()
    templates = []
    for doc in docs:
        data = doc.to_dict()
        if 'embedding' in data:
            sim = cosine_similarity(query_emb, data['embedding'])
            data['similarity'] = sim
            templates.append(data)

    # Sort and return top 5
    templates.sort(key=lambda x: x['similarity'], reverse=True)
    return {"results": templates[:5]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 