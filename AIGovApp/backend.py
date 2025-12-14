import os
import pickle
import numpy as np

# Optional imports: these packages are large and may not be installed in all
# environments. We try to import them and only fail at runtime if a function
# requiring them is called.
try:
    from sentence_transformers import SentenceTransformer  # type: ignore
except Exception:  # pragma: no cover - imported optionally
    SentenceTransformer = None  # type: ignore

try:
    from sklearn.metrics.pairwise import cosine_similarity  # type: ignore
except Exception:  # pragma: no cover - imported optionally
    cosine_similarity = None  # type: ignore


SIM_THRESHOLD = 0.55


# Load embeddings if available
DF_PATH = "recipes_embeddings.pkl"
if os.path.exists(DF_PATH):
    with open(DF_PATH, "rb") as f:
        df = pickle.load(f)
else:
    df = None


def _ensure_model():
    if SentenceTransformer is None or cosine_similarity is None:
        raise RuntimeError(
            "Required Python packages are missing: install 'sentence-transformers' and 'scikit-learn' to enable semantic search."
        )


def get_recipe(user_ingredients):
    """Return the best matching recipe from precomputed embeddings.

    Raises a RuntimeError with instructions if required packages or data
    are not available.
    """
    if df is None:
        raise RuntimeError("Embeddings dataset not found. Generate `recipes_embeddings.pkl` first.")

    _ensure_model()

    model = SentenceTransformer("all-MiniLM-L6-v2")
    user_emb = model.encode(user_ingredients)

    sims = cosine_similarity([user_emb], np.vstack(df['embedding']))[0]
    best_idx = int(np.argmax(sims))
    best_score = float(sims[best_idx])
    recipe = df.iloc[best_idx]

    if best_score < SIM_THRESHOLD:
        return {"type": "generated", "message": "No close match found"}

    return {
        "type": "matched",
        "title": recipe.get("title"),
        "ingredients": recipe.get("ingredients_name"),
        "instructions": recipe.get("instructions"),
        "score": best_score,
    }
