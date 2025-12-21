import { useCallback, useState } from 'react';
import { searchRecipes, generateRecipe, SearchResult } from '../lib/recipeApi';

export default function useRecipeSearch(baseUrl?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SearchResult | null>(null);

  const search = useCallback(async (ingredients: string, top_k = 3) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchRecipes(ingredients, top_k, baseUrl);
      setLastResult(res);
      return res;
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const generate = useCallback(async (ingredients: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateRecipe(ingredients, baseUrl);
      return res;
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return { search, generate, loading, error, lastResult };
}
