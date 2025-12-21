import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type SearchResult = {
  best_score: number;
  results: Array<{
    score: number;
    title: string;
    ingredients: string;
    instructions: string;
  }>;
};

const DEFAULT_LOCAL_BASE = 'http://localhost:8080';
const DEFAULT_ANDROID_EMULATOR = 'http://10.0.2.2:8080';

function getDefaultBase() {
  // Try Expo runtime config (app.json extra)
  const extras = (Constants.expoConfig && (Constants.expoConfig as any).extra) || (Constants.manifest && (Constants.manifest as any).extra) || {};
  if (extras && extras.RECIPE_API_BASE) return extras.RECIPE_API_BASE as string;

  // Fallbacks per platform
  if (Platform.OS === 'android') return DEFAULT_ANDROID_EMULATOR;
  return DEFAULT_LOCAL_BASE;
}

const DEFAULT_BASE = getDefaultBase();

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Status ${res.status}: ${text}`);
  }
  return res.json();
}

export async function searchRecipes(ingredients: string, top_k = 3, baseUrl = DEFAULT_BASE): Promise<SearchResult> {
  return postJson(`${baseUrl}/search`, { ingredients, top_k });
}

export async function generateRecipe(ingredients: string, baseUrl = DEFAULT_BASE): Promise<{ generated: string | null; reason?: string; best_score?: number }> {
  return postJson(`${baseUrl}/generate`, { ingredients });
}
