import os
from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

# Paths
CSV = Path(r"C:\Users\imwri\Downloads\Food_Recipe.csv")
OUT_DIR = Path(__file__).parent
EMB_FILE = OUT_DIR / 'recipe_embeddings.npy'
META_FILE = OUT_DIR / 'recipes_with_meta.parquet'

if not CSV.exists():
    raise SystemExit(f"CSV not found: {CSV}")

print(f"Loading CSV from {CSV}")

df = pd.read_csv(CSV)
print('Read rows:', len(df))

# Keep only rows with required fields
required = ['ingredients_name', 'ingredients_quantity', 'instructions']
df = df.dropna(subset=required)

# Create title column
if 'description' in df.columns:
    df['title'] = df['description']
elif 'recipe_name' in df.columns:
    df['title'] = df['recipe_name']
else:
    df['title'] = 'Untitled'

# Group by title and aggregate
print('Grouping and aggregating by title...')
recipe_df = (
    df.groupby('title')
      .agg({
          'ingredients_name': lambda x: ', '.join(x.astype(str)),
          'ingredients_quantity': lambda x: ', '.join(x.astype(str)),
          'instructions': 'first'
      })
      .reset_index()
)

# Normalization helper
def normalize(text):
    text = str(text).lower()
    text = text.replace(',', ' ')
    text = text.replace('|', ' ')
    return ' '.join(text.split())

recipe_df['ingredients_name'] = recipe_df['ingredients_name'].apply(normalize)
recipe_df['ingredients_quantity'] = recipe_df['ingredients_quantity'].apply(normalize)

# Prepare text_for_embedding
recipe_df['text_for_embedding'] = (
    recipe_df['ingredients_name'] + ' | ' + recipe_df['ingredients_quantity']
)

# Ensure there is at least one entry
if len(recipe_df) == 0:
    raise SystemExit('No recipes after cleanup')

print('Computing embeddings with SentenceTransformer (all-MiniLM-L6-v2)')
model = SentenceTransformer('all-MiniLM-L6-v2')

texts = recipe_df['text_for_embedding'].astype(str).tolist()
embeddings = model.encode(texts, batch_size=32, show_progress_bar=True)
embeddings = np.array(embeddings, dtype=np.float32)

print('Embeddings shape:', embeddings.shape)

# Store embeddings both as numpy array file and as a column of lists in the parquet
np.save(EMB_FILE, embeddings)
recipe_df['embedding'] = embeddings.tolist()
recipe_df.to_parquet(META_FILE, index=False)

print('Saved:')
print(' -', EMB_FILE)
print(' -', META_FILE)
