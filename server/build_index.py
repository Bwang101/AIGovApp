"""Helper script to build and save FAISS index from artifacts produced by the Colab notebook."""
import os
import faiss
import numpy as np
import pandas as pd

ARTIFACTS_DIR = os.environ.get('ARTIFACTS_DIR', '.')
EMB_FILE = os.path.join(ARTIFACTS_DIR, 'recipe_embeddings.npy')
META_FILE = os.path.join(ARTIFACTS_DIR, 'recipes_with_meta.parquet')
INDEX_FILE = os.path.join(ARTIFACTS_DIR, 'recipe_index.faiss')

if not (os.path.exists(EMB_FILE) and os.path.exists(META_FILE)):
    raise SystemExit('Place recipe_embeddings.npy and recipes_with_meta.parquet in ARTIFACTS_DIR')

embs = np.load(EMB_FILE).astype('float32')
meta = pd.read_parquet(META_FILE)

print('Embeddings shape', embs.shape)
faiss.normalize_L2(embs)
d = embs.shape[1]
index = faiss.IndexFlatIP(d)
index.add(embs)

faiss.write_index(index, INDEX_FILE)
print('Wrote index to', INDEX_FILE)
