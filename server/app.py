import os
import logging
from typing import List
from fastapi import FastAPI, HTTPException, Request, Query
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


def import_recipe_model():
    """Try multiple import strategies to load the optional recipe_model module."""
    try:
        # Normal absolute import (when running from server package)
        import recipe_model
        return recipe_model
    except Exception as e_abs:
        try:
            # Relative import when app is part of a package
            from . import recipe_model as rm
            return rm
        except Exception:
            try:
                # Try importing explicit package path
                import importlib
                return importlib.import_module('server.recipe_model')
            except Exception as e_pkg:
                logger.debug('Could not import recipe_model (abs=%s, pkg=%s)', e_abs, e_pkg)
                return None

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

class QueryModel(BaseModel):
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
    global index, meta
    if os.path.exists(INDEX_FILE):
        try:
            index = faiss.read_index(INDEX_FILE)
            logger.info('Loaded FAISS index from %s', INDEX_FILE)
        except Exception:
            logger.warning('Failed to load index from disk, rebuilding')
            build_index()
    else:
        build_index()
    
    # Load metadata if not already loaded
    if meta is None:
        if os.path.exists(META_FILE):
            meta = pd.read_parquet(META_FILE)
            logger.info('Loaded metadata from %s', META_FILE)
        else:
            raise RuntimeError('Missing metadata file. Run build_index() first.')

    # Try to load the new recipe_model (semantic+overlap + generator)
    recipe_model = import_recipe_model()
    if recipe_model is not None:
        try:
            recipe_model.load(ARTIFACTS_DIR)
            logger.info('Loaded recipe_model and its artifacts')
        except Exception as e:
            logger.warning('Could not initialize recipe_model: %s', e)
    else:
        logger.warning('recipe_model not available')


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.get('/recipes')
@limiter.limit("10/minute")
def get_all_recipes(request: Request, shuffle: bool = Query(False, description="Shuffle recipes randomly")):
    """Return all recipes from the database. Set shuffle=true to randomize order."""
    global meta
    if meta is None:
        raise HTTPException(status_code=500, detail='Database not ready')
    
    import random
    
    should_shuffle = shuffle
    
    results = []
    indices = list(range(len(meta)))
    
    if should_shuffle:
        random.shuffle(indices)
        logger.info(f'Shuffling {len(indices)} recipes')
    
    for idx in indices:
        results.append({
            'id': int(idx),
            'title': meta.iloc[idx]['title'],
            'ingredients': meta.iloc[idx]['ingredients_name'],
            'instructions': meta.iloc[idx].get('instructions', ''),
            'image_url': ''
        })
    
    logger.info(f'Returning all {len(results)} recipes from database (shuffled={should_shuffle})')
    return {'total': len(results), 'recipes': results}


@app.get('/recipes/print')
@limiter.limit("5/minute")
def print_all_recipes(request: Request):
    """Print all recipes to console/logs for debugging."""
    global meta
    if meta is None:
        raise HTTPException(status_code=500, detail='Database not ready')
    
    logger.info(f'=== PRINTING ALL {len(meta)} RECIPES FROM DATABASE ===')
    for idx in range(len(meta)):
        recipe = meta.iloc[idx]
        logger.info(f'\nRecipe {idx + 1}/{len(meta)}:')
        logger.info(f'  Title: {recipe.get("title", "N/A")}')
        logger.info(f'  Ingredients: {recipe.get("ingredients_name", "N/A")}')
        logger.info(f'  Instructions: {recipe.get("instructions", "N/A")[:100]}...')
    
    logger.info(f'\n=== END OF RECIPES PRINT ===')
    return {'message': f'Printed {len(meta)} recipes to logs', 'total': len(meta)}


@app.post('/search')
@limiter.limit("30/minute")
def search(q: QueryModel, request: Request):
    global index, model, meta

    # Use the new recipe_model if available
    recipe_model = import_recipe_model()

    if recipe_model is not None and getattr(recipe_model, 'recipe_df', None) is not None:
        try:
            df = recipe_model.find_best_recipes(q.ingredients, top_k=q.top_k if q.top_k > 0 else 5)
        except Exception as e:
            logger.exception('Recipe model search failed: %s', e)
            raise HTTPException(status_code=500, detail=str(e))

        results = []
        for idx, row in df.iterrows():
            results.append({
                'score': float(row['final_score']),
                'semantic_score': float(row['semantic_score']),
                'overlap_score': float(row['overlap_score']),
                'id': int(idx),
                'title': row['title'],
                'ingredients': row.get('ingredients_name', ''),
                'instructions': row.get('instructions', ''),
                'image_url': row.get('image_url', '') if 'image_url' in row else ''
            })

        best_score = results[0]['score'] if results else 0.0
        logger.info(f'Search query (recipe_model): "{q.ingredients}" returned {len(results)} results (top_k={q.top_k}, total_db={len(recipe_model.recipe_df)})')
        logger.info(f'Top 3 results: {[r["title"] for r in results[:3]]}')
        return {'best_score': best_score, 'results': results, 'total_returned': len(results), 'total_in_db': len(recipe_model.recipe_df)}

    # Fallback to FAISS search if recipe_model not available
    if index is None:
        raise HTTPException(status_code=500, detail='Index not ready')

    # If top_k is 0 or negative, return all recipes
    if q.top_k <= 0:
        q.top_k = len(meta) if meta is not None else 1000

    qv = model.encode([q.ingredients]).astype('float32')
    faiss.normalize_L2(qv)
    # Ensure we don't request more than available
    max_k = min(q.top_k, len(meta) if meta is not None else q.top_k)
    D, I = index.search(qv, max_k)

    results = []
    for score, idx in zip(D[0], I[0]):
        results.append({
            'score': float(score),
            'id': int(idx),
            'title': meta.iloc[idx]['title'],
            'ingredients': meta.iloc[idx]['ingredients_name'],
            'instructions': meta.iloc[idx].get('instructions', ''),
            'image_url': ''
        })

    best_score = results[0]['score'] if results else 0.0
    logger.info(f'Search query: "{q.ingredients}" returned {len(results)} results (top_k={q.top_k}, max_k={max_k}, total_db={len(meta)})')
    logger.info(f'Top 3 results: {[r["title"] for r in results[:3]]}')
    return {'best_score': best_score, 'results': results, 'total_returned': len(results), 'total_in_db': len(meta)}


@app.post('/generate')
@limiter.limit("5/minute")
def generate(q: QueryModel, request: Request):
    """Generate a recipe if similarity is too low. Uses the local generator if available, otherwise OpenAI if configured."""
    best = search(q)
    if best['best_score'] >= SIM_THRESHOLD:
        return {'generated': None, 'reason': 'good match exists', 'best_score': best['best_score']}

    # Prefer local generator if available
    recipe_model = import_recipe_model()

    if recipe_model is not None and getattr(recipe_model, '_generator', None) is not None:
        try:
            text = recipe_model.generate_recipe(q.ingredients)
            return {'generated': text, 'best_score': best['best_score'], 'source': 'local_flant5'}
        except Exception as e:
            logger.warning('Local generator failed: %s', e)

    # Fallback to OpenAI if available
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        import openai
        openai.api_key = openai_key
        prompt = f"Create a recipe using these ingredients: {q.ingredients}. Include steps and measurements. Keep it concise and clear." 
        resp = openai.ChatCompletion.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': prompt}], max_tokens=350)
        text = resp['choices'][0]['message']['content']
        return {'generated': text, 'best_score': best['best_score'], 'source': 'openai'}

    return {'generated': None, 'reason': 'No generator available', 'best_score': best['best_score']}
