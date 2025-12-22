import os
from typing import Optional
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from transformers import pipeline
except Exception:
    pipeline = None

# Config
SIM_THRESHOLD = float(os.environ.get('SIM_THRESHOLD', 0.55))
MODEL_NAME = os.environ.get('SENTENCE_MODEL', 'all-MiniLM-L6-v2')
GENERATOR_MODEL = os.environ.get('TEXT_GEN_MODEL', 'google/flan-t5-large')

# Globals
recipe_df: Optional[pd.DataFrame] = None
embs: Optional[np.ndarray] = None
model: Optional[SentenceTransformer] = None
_generator = None


def normalize(text: str) -> str:
    text = str(text).lower()
    text = text.replace(',', ' ')
    text = text.replace('|', ' ')
    return ' '.join(text.split())


def ingredient_overlap(user: str, recipe: str) -> float:
    user_set = set(user.split())
    recipe_set = set(recipe.split())
    if len(user_set) == 0:
        return 0.0
    return len(user_set & recipe_set) / len(user_set)


def load(artifacts_dir: str = '.', parquet_name: str = 'recipes_with_meta.parquet', emb_file: str = 'recipe_embeddings.npy'):
    """Load metadata and embeddings. If per-row "embedding" exists in parquet, use that; otherwise try to load numpy embeddings."""
    global recipe_df, embs, model, _generator

    meta_path = os.path.join(artifacts_dir, parquet_name)
    emb_path = os.path.join(artifacts_dir, emb_file)

    if not os.path.exists(meta_path):
        raise FileNotFoundError(f"Metadata file not found: {meta_path}")

    recipe_df = pd.read_parquet(meta_path)

    # If an 'embedding' column exists (lists), convert to numpy stack
    if 'embedding' in recipe_df.columns:
        try:
            embs = np.vstack(recipe_df['embedding'].values).astype('float32')
        except Exception:
            embs = None

    # Fallback: load embeddings numpy file if present
    if embs is None and os.path.exists(emb_path):
        embs = np.load(emb_path).astype('float32')

    # Load encoder model
    if model is None:
        model = SentenceTransformer(MODEL_NAME)

    # Initialize generator pipeline if available
    if pipeline is not None and _generator is None:
        try:
            _generator = pipeline('text2text-generation', model=GENERATOR_MODEL, max_length=512)
        except Exception:
            _generator = None

    return True


def find_best_recipes(user_ingredients: str, top_k: int = 5):
    """Return a DataFrame with top_k recipes sorted by final_score."""
    global recipe_df, embs, model
    if recipe_df is None or embs is None:
        raise RuntimeError('Model not loaded. Call load() first.')

    user_norm = normalize(user_ingredients)
    user_emb = model.encode(user_norm).astype('float32')

    sims = cosine_similarity([user_emb], embs)[0]

    df = recipe_df.copy()
    df['semantic_score'] = sims
    df['overlap_score'] = df['ingredients_name'].fillna('').apply(lambda x: ingredient_overlap(user_norm, normalize(x)))
    df['final_score'] = 0.7 * df['semantic_score'] + 0.3 * df['overlap_score']

    results = df.sort_values('final_score', ascending=False).head(top_k).reset_index(drop=True)
    return results


def generate_recipe(user_ingredients: str) -> str:
    global _generator
    if pipeline is None:
        raise RuntimeError('transformers not installed or failed to import')
    if _generator is None:
        # Try to load on demand
        try:
            _generator = pipeline('text2text-generation', model=GENERATOR_MODEL, max_length=512)
        except Exception as e:
            raise RuntimeError(f'Failed to load generator model: {e}')

    prompt = f"""
Create a complete cooking recipe using the following ingredients:
{user_ingredients}

Include:
- Ingredient list with measurements
- Step-by-step cooking instructions
"""

    out = _generator(prompt)
    return out[0]['generated_text']


def get_top_score(user_ingredients: str) -> float:
    res = find_best_recipes(user_ingredients, top_k=1)
    if res.empty:
        return 0.0
    return float(res.iloc[0]['final_score'])
