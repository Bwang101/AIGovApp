"""Simple benchmarking script to measure search latency.
Usage: python bench.py --query "rice, pineapple" --iters 100
"""
import time
import argparse
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import pandas as pd

parser = argparse.ArgumentParser()
parser.add_argument('--query', default='rice, pineapple')
parser.add_argument('--iters', type=int, default=100)
args = parser.parse_args()

# load artifacts
emb = np.load('recipe_embeddings.npy')
meta = pd.read_parquet('recipes_with_meta.parquet')
faiss.normalize_L2(emb)
d = emb.shape[1]
idx = faiss.IndexFlatIP(d)
idx.add(emb)
model = SentenceTransformer('all-MiniLM-L6-v2')

qv = model.encode([args.query]).astype('float32')
faiss.normalize_L2(qv)

start = time.perf_counter()
for _ in range(args.iters):
    D, I = idx.search(qv, 10)
end = time.perf_counter()

print(f"Avg latency: {(end-start)/args.iters*1000:.3f} ms over {args.iters} runs")
