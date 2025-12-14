import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, FlatList, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import RECIPES, { Recipe } from '../data/recipes';
import Storage from '../utils/storage';

type HistoryItem = {
  id: string;
  title: string;
  favorite?: boolean;
};

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showRecipe, setShowRecipe] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await Storage.getItem('@byte_to_bite_history');
        if (raw) setHistory(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const saveHistory = async (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    await Storage.setItem('@byte_to_bite_history', JSON.stringify(newHistory));
  };

  const parseIngredients = (text: string) =>
    text
      .split(/,|\n| and |;/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  const findRecipe = (userInput: string): Recipe | null => {
    const provided = new Set(parseIngredients(userInput));
    // try exact subset
    const subset = RECIPES.filter((r) => {
      const req = new Set<string>(r.ingredients.map((i: string) => i.toLowerCase()));
      for (const item of Array.from(req)) if (!provided.has(item)) return false;
      return req.size > 0;
    });

    if (subset.length > 0) return subset[0];

    // fallback: best match by overlap
    let best: Recipe | null = null;
    let bestScore = -1;
    for (const r of RECIPES) {
      const req = r.ingredients.map((i: string) => i.toLowerCase());
      const match = req.filter((i: string) => provided.has(i)).length;
      const score = match / Math.max(req.length, 1);
      if (score > bestScore) {
        best = r;
        bestScore = score;
      }
    }
    return best;
  };

  const onSearch = async () => {
    const r = findRecipe(input);
    setResult(r);
    if (r) {
      setShowRecipe(true);
      const newItem: HistoryItem = { id: r.id, title: r.title, favorite: false };
      // prepend if not duplicate
      const existing = history.find((h) => h.id === newItem.id);
      let newHist = history.slice();
      if (!existing) newHist = [newItem, ...newHist];
      else {
        // move to front
        newHist = [existing, ...history.filter((h) => h.id !== existing.id)];
      }
      await saveHistory(newHist.slice(0, 50));
    }
  };

  const toggleFavorite = async (id: string) => {
    const newHist = history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h));
    await saveHistory(newHist);
  };

  const router = require('expo-router').useRouter();

  if (showRecipe && result) {
    return (
      <ThemedView style={styles.recipeModal}>
        <Pressable onPress={() => setShowRecipe(false)} style={styles.backButton}>
          <ThemedText type="defaultSemiBold" style={styles.backText}>← Back</ThemedText>
        </Pressable>
        <ScrollView style={styles.recipeScroll} contentContainerStyle={styles.recipeScrollContent}>
          <ThemedView style={styles.recipeContent}>
            <ThemedText type="title" style={styles.recipeTitle}>{result.title}</ThemedText>
            <ThemedText style={styles.sectionLabel}>Ingredients:</ThemedText>
            <ThemedText style={styles.recipeText}>{result.ingredients.join(', ')}</ThemedText>
            <ThemedText style={styles.sectionLabel}>Instructions:</ThemedText>
            <ThemedText style={styles.recipeText}>{result.instructions}</ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.titleText}>Byte to Bite</ThemedText>
      <ThemedText type="subtitle" style={styles.subtitleText}>Tell me what you have — we'll find recipes</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="e.g. basmati rice, onion, ghee, cashew nuts"
        placeholderTextColor="#a8c7ba"
        value={input}
        onChangeText={setInput}
        multiline
      />

      <Pressable style={styles.button} onPress={onSearch}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>Find Recipe</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e9f8f0',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#053b2a',
    color: '#e6fff2',
    borderColor: '#0f5132',
  },
  button: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#0f5132',
    borderRadius: 10,
    width: 160,
  },
  buttonText: {
    color: '#fff',
  },
  titleText: {
    color: '#000',
  },
  subtitleText: {
    color: '#222',
  },
  recipeModal: {
    flex: 1,
    backgroundColor: '#e9f8f0',
    paddingTop: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backText: {
    color: '#0f5132',
    fontSize: 16,
  },
  recipeScroll: {
    flex: 1,
  },
  recipeScrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  recipeContent: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#f7fff9',
    borderRadius: 12,
    padding: 20,
  },
  recipeTitle: {
    color: '#000',
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#000',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
  },
  recipeText: {
    color: '#222',
    lineHeight: 22,
    fontSize: 14,
  },
});
