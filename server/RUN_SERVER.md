# How to Run the Recipe Search Server

## Prerequisites
- Python 3.8+ installed
- Recipe data files from your Colab notebook:
  - `recipe_embeddings.npy`
  - `recipes_with_meta.parquet`

## Step-by-Step Instructions

### 1. Navigate to the server directory
```bash
cd server
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv .venv
```

### 3. Activate the virtual environment

**On Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**On Mac/Linux:**
```bash
source .venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Place your recipe data files
Make sure these files are in the `server/` directory:
- `recipe_embeddings.npy`
- `recipes_with_meta.parquet`

(These should come from your Google Colab notebook)

### 6. (Optional) Build the FAISS index
```bash
python build_index.py
```

### 7. Run the server
```bash
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

The `--reload` flag enables auto-reload on code changes (useful for development).

### 8. Verify the server is running
Open your browser and go to:
- http://localhost:8080/health

You should see: `{"status":"ok"}`

Or check the API docs at:
- http://localhost:8080/docs

## Troubleshooting

### Port already in use
If port 8080 is already in use, you can change it:
```bash
uvicorn app:app --host 0.0.0.0 --port 8081 --reload
```
Then update your app's `RECIPE_API_BASE` to use port 8081.

### Missing data files
If you get an error about missing files, make sure:
1. `recipe_embeddings.npy` is in the server directory
2. `recipes_with_meta.parquet` is in the server directory
3. Or set `ARTIFACTS_DIR` environment variable to point to where your files are

### Module not found errors
Make sure you've activated your virtual environment and installed all dependencies:
```bash
pip install -r requirements.txt
```

## Testing the Server

Once running, test with:
```bash
curl -X POST http://localhost:8080/search -H "Content-Type: application/json" -d "{\"ingredients\":\"rice, chicken\",\"top_k\":3}"
```

Or visit http://localhost:8080/docs for interactive API documentation.

