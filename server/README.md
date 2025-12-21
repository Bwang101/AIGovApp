# Recipe Search API (FastAPI + FAISS)

This service provides a /search endpoint that uses precomputed SentenceTransformers embeddings and FAISS for fast similarity search.

Quick start (local):

1. Copy artifacts from the Colab notebook to the `server/` directory (or set `ARTIFACTS_DIR` env var):
   - `recipe_embeddings.npy`
   - `recipes_with_meta.parquet`

2. Create a virtualenv and install deps:

```bash
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. (Optional) Build the FAISS index file:

```bash
python build_index.py
```

4. Run the server:

```bash
uvicorn app:app --host 0.0.0.0 --port 8080
```

5. Example request:

```bash
curl -X POST http://localhost:8080/search -H "Content-Type: application/json" -d '{"ingredients":"cooked rice, pineapple, green beans","top_k":3}'
```

Generate endpoint:
- If you set `OPENAI_API_KEY` in the environment, call `/generate` to create a recipe when no good match exists.

Notes:
- This repo expects Float32 embeddings and uses inner-product on L2-normalized vectors (cosine similarity).
- For production, consider a managed vector DB (Pinecone/Weaviate/Milvus) and authenticated endpoints.

Client configuration:
- If you're testing the React Native app with a simulator or device, make sure the client is pointed at the server URL.
- For Expo apps, you can set the `RECIPE_API_BASE` runtime config in `app.json` under `expo.extra` (e.g., `"RECIPE_API_BASE": "http://192.168.1.100:8080"`).
- Android emulator may use `http://10.0.2.2:8080` to reach your machine.

Production & best practices:
- Rate limiting is enabled by default (30 req/min for `/search`, 5 req/min for `/generate`) via `slowapi`. Configure via env vars or edit the decorators.
- Sentry integration is supported by setting `SENTRY_DSN` in the environment; errors and traces will be sent to Sentry when configured.
- Benchmark: use `python bench.py --query "rice" --iters 100` to measure search latency with your artifacts.
- CI: This repo contains GitHub Actions workflows to run Python and Node tests (`.github/workflows/ci.yml`) and to build/push Docker images (`.github/workflows/docker-build-and-push.yml`). A manual Cloud Run deploy workflow (`.github/workflows/cloud-run-deploy.yml`) is provided — set `GCP_PROJECT`, `GCP_SA_KEY`, and `GCP_REGION` secrets to use it.
