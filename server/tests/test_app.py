import os
import tempfile
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

# set up temporary artifacts dir
from server import app as server_app


def make_artifacts(tmpdir):
    emb = np.random.RandomState(0).randn(3, 384).astype('float32')
    # normalize for cosine
    import faiss
    faiss.normalize_L2(emb)
    np.save(os.path.join(tmpdir, 'recipe_embeddings.npy'), emb)

    meta = pd.DataFrame({
        'title': ['Rice Pineapple', 'Green Beans Stir', 'Plain Rice'],
        'ingredients_name': ['rice,pineapple', 'green beans,garlic', 'rice'],
        'ingredients_quantity': ['1 cup,1/2', '2 cups,1 clove', '1 cup'],
        'instructions': ['cook rice, mix pineapple', 'stir fry beans', 'cook rice']
    })
    meta.to_parquet(os.path.join(tmpdir, 'recipes_with_meta.parquet'))


def test_search_and_generate(tmp_path, monkeypatch):
    tmpdir = str(tmp_path)
    make_artifacts(tmpdir)
    # set env so server knows where to find artifacts
    os.environ['ARTIFACTS_DIR'] = tmpdir

    # If OPENAI is called, monkeypatch it
    class FakeChat:
        @staticmethod
        def create(*args, **kwargs):
            return {'choices': [{'message': {'content': 'Generated fake recipe'}}]}

    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    import builtins
    import importlib

    # reload the app module to pick up ARTIFACTS_DIR
    import server.app as appmod
    importlib.reload(appmod)

    client = TestClient(appmod.app)

    # search
    r = client.post('/search', json={'ingredients': 'rice, pineapple', 'top_k': 2})
    assert r.status_code == 200
    j = r.json()
    assert 'best_score' in j and 'results' in j

    # patch openai
    import types
    fake_openai = types.SimpleNamespace(ChatCompletion=types.SimpleNamespace(create=lambda **kwargs: {'choices':[{'message':{'content':'gen'}}]}))
    monkeypatch.setitem(os.environ, 'OPENAI_API_KEY', 'x')
    monkeypatch.setattr('server.app.openai', fake_openai, raising=False)

    r2 = client.post('/generate', json={'ingredients': 'rice, pineapple'})
    assert r2.status_code == 200
    j2 = r2.json()
    # may return generated key or reason
    assert 'generated' in j2 or 'reason' in j2
