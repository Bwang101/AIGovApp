import os
import logging
from typing import List
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

# Optional rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Optional Sentry
import sentry_sdk

load_dotenv()

# init Sentry if DSN provided
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if SENTRY_DSN:
    sentry_sdk.init(dsn=SENTRY_DSN)

logger = logging.getLogger("server")
logging.basicConfig(level=logging.INFO)

ARTIFACTS_DIR = os.environ.get('ARTIFACTS_DIR', '.')
EMB_FILE = os.path.join(ARTIFACTS_DIR, 'recipe_embeddings.npy')
META_FILE = os.path.join(ARTIFACTS_DIR, 'recipes_with_meta.parquet')
INDEX_FILE = os.path.join(ARTIFACTS_DIR, 'recipe_index.faiss')
SIM_THRESHOLD = float(os.environ.get('SIM_THRESHOLD', 0.55))

app = FastAPI(title="Recipe Search API")

# CORS - allow all for now; lock to origins in production via env
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get('CORS_ALLOW_ORIGIN', '*')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter - default 60 requests per minute per IP
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
from slowapi.middleware import SlowAPIMiddleware

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

class Query(BaseModel):
    ingredients: str
    top_k: int = 5

# Lazy-loaded globals
model = SentenceTransformer('all-MiniLM-L6-v2')
index = None
embs = None
meta = None


def build_index():
    global index, embs, meta
    if not (os.path.exists(EMB_FILE) and os.path.exists(META_FILE)):
        raise RuntimeError('Missing embedding artifacts. Run the Colab notebook and copy artifacts to ARTIFACTS_DIR')

    embs = np.load(EMB_FILE).astype('float32')
    meta = pd.read_parquet(META_FILE)

    # normalize
    faiss.normalize_L2(embs)
    d = embs.shape[1]
    idx = faiss.IndexFlatIP(d)
    idx.add(embs)

    # save index if possible
    try:
        faiss.write_index(idx, INDEX_FILE)
        logger.info('Saved FAISS index to %s', INDEX_FILE)
    except Exception:
        logger.warning('Could not write FAISS index to disk')

    index = idx


@app.on_event('startup')
def startup_event():
    global index
    if os.path.exists(INDEX_FILE):
        try:
            index = faiss.read_index(INDEX_FILE)
            logger.info('Loaded FAISS index from %s', INDEX_FILE)
        except Exception:
            logger.warning('Failed to load index from disk, rebuilding')
            build_index()
    else:
        build_index()


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/search')
@limiter.limit("30/minute")
def search(q: Query, request: Request):
    global index, model, meta
    if index is None:
        raise HTTPException(status_code=500, detail='Index not ready')

    qv = model.encode([q.ingredients]).astype('float32')
    faiss.normalize_L2(qv)
    D, I = index.search(qv, q.top_k)

    results = []
    for score, idx in zip(D[0], I[0]):
        results.append({
            'score': float(score),
            'title': meta.iloc[idx]['title'],
            'ingredients': meta.iloc[idx]['ingredients_name'],
            'instructions': meta.iloc[idx].get('instructions', '')
        })

    best_score = results[0]['score'] if results else 0.0
    return {'best_score': best_score, 'results': results}


@app.post('/generate')
@limiter.limit("5/minute")
def generate(q: Query, request: Request):
    """Generate a recipe if similarity is too low. This uses OpenAI when OPENAI_API_KEY is set."""
    best = search(q)
    if best['best_score'] >= SIM_THRESHOLD:
        return {'generated': None, 'reason': 'good match exists', 'best_score': best['best_score']}

    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        return {'generated': None, 'reason': 'OpenAI key not configured'}

    import openai
    openai.api_key = openai_key
    prompt = f"Create a recipe using these ingredients: {q.ingredients}. Include steps and measurements. Keep it concise and clear." 
    resp = openai.ChatCompletion.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': prompt}], max_tokens=350)
    text = resp['choices'][0]['message']['content']
    return {'generated': text, 'best_score': best['best_score']}
