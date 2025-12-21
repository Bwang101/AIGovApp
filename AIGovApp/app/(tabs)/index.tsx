import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import RECIPES, { Recipe } from '../data/recipes';
import Storage from '../utils/storage';
import useRecipeSearch from '../hooks/useRecipeSearch';
import { Colors } from '@/constants/theme';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  // AI Buttons component
  const AIButtons = () => {
    const { search, generate, loading, error, lastResult } = useRecipeSearch();
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [aiResults, setAiResults] = useState<any | null>(null);

    const onAiSearch = async () => {
      if (!input || input.trim().length === 0) return;
      try {
        const res = await search(input, 3);
        // if we have a close match, use it like local search
        if (res && res.results && res.results.length > 0 && res.best_score >= 0.55) {
          const top = res.results[0];
          const newRecipe = {
            id: `ai-${Date.now()}`,
            title: top.title || 'AI Match',
            ingredients: (typeof top.ingredients === 'string' ? top.ingredients.split(',') : top.ingredients) || [],
            instructions: top.instructions || '',
          } as any;
          setResult(newRecipe);
          setShowRecipe(true);

          // push to history
          const newItem: HistoryItem = { id: newRecipe.id, title: newRecipe.title, favorite: false };
          const existing = history.find((h) => h.id === newItem.id);
          let newHist = history.slice();
          if (!existing) newHist = [newItem, ...newHist];
          else newHist = [existing, ...history.filter((h) => h.id !== existing.id)];
          await saveHistory(newHist.slice(0, 50));
          return;
        }

        // else open modal to show results and allow generation
        setAiModalVisible(true);
        setAiResults(res);
      } catch (e) {
        // ignore, error displayed below
      }
    };

    const onGenerate = async () => {
      try {
        const gen = await generate(input);
        setGeneratedText(gen.generated || 'No generated text');
      } catch (e) {
        // ignore
      }
    };

    return (
      <>
        <AnimatedButton
          title={loading ? 'Searching...' : 'Find with AI'}
          onPress={onAiSearch}
          variant="secondary"
          style={styles.aiButton}
          loading={loading}
        />

        <Modal visible={aiModalVisible} animationType="slide" onRequestClose={() => setAiModalVisible(false)}>
          <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <AnimatedButton
            title="← Back"
            onPress={() => setAiModalVisible(false)}
            variant="outline"
            size="small"
          />
        </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <AnimatedCard variant="elevated" style={styles.modalCard} entering={FadeIn.duration(400)}>
                <ThemedText type="title" style={styles.modalTitle}>AI Results</ThemedText>
                {error ? (
                  <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
                ) : null}
                {aiResults && aiResults.results && aiResults.results.length > 0 ? (
                  aiResults.results.map((r: any, i: number) => (
                    <AnimatedCard
                      key={i}
                      variant="outlined"
                      style={styles.resultCard}
                      entering={FadeInDown.duration(400).delay(i * 100)}>
                      <ThemedText type="defaultSemiBold" style={styles.resultTitle}>{r.title}</ThemedText>
                      <Badge label={`Score: ${r.score.toFixed(2)}`} variant="accent" style={styles.scoreBadge} />
                      <ThemedText style={styles.resultText}>
                        {typeof r.ingredients === 'string' ? r.ingredients : (r.ingredients || []).join(', ')}
                      </ThemedText>
                      <ThemedText style={styles.sectionLabel}>Instructions</ThemedText>
                      <ThemedText style={styles.resultText}>{r.instructions}</ThemedText>
                    </AnimatedCard>
                  ))
                ) : (
                  <ThemedText style={styles.resultText}>No close matches. You can generate a custom recipe.</ThemedText>
                )}

                <AnimatedButton
                  title="Generate Recipe"
                  onPress={onGenerate}
                  variant="primary"
                  style={styles.generateButton}
                  loading={loading}
                />

                {generatedText ? (
                  <AnimatedCard variant="outlined" style={styles.generatedCard} entering={FadeIn.duration(400)}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Generated Recipe</ThemedText>
                    <ThemedText style={styles.resultText}>{generatedText}</ThemedText>
                  </AnimatedCard>
                ) : null}
              </AnimatedCard>
            </ScrollView>
          </ThemedView>
        </Modal>
      </>
    );
  };

  if (showRecipe && result) {
    return (
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <AnimatedButton
            title="← Back"
            onPress={() => setShowRecipe(false)}
            variant="outline"
            size="small"
          />
        </View>
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
          <AnimatedCard variant="elevated" style={styles.recipeCard} entering={FadeIn.duration(400)}>
            <ThemedText type="title" style={styles.recipeTitle}>{result.title}</ThemedText>
            
            <View style={styles.ingredientsSection}>
              <ThemedText style={styles.sectionLabel}>Ingredients</ThemedText>
              <View style={styles.ingredientsList}>
                {result.ingredients.map((ing: string, idx: number) => (
                  <Badge key={idx} label={ing} variant="gray" style={styles.ingredientBadge} />
                ))}
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <ThemedText style={styles.sectionLabel}>Instructions</ThemedText>
              <ThemedText style={styles.instructionsText}>{result.instructions}</ThemedText>
            </View>
          </AnimatedCard>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).delay(0)} style={styles.header}>
          <ThemedText type="title" style={styles.titleText}>Find Your Favorite Food</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitleText}>
            Tell us what ingredients you have
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <AnimatedCard variant="elevated" style={styles.searchCard}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textGray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for ingredients..."
                placeholderTextColor={colors.textLight}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <Ionicons name="options" size={20} color={colors.textGray} />
            </View>
          </AnimatedCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.buttonContainer}>
          <AnimatedButton
            title="Find Recipe"
            onPress={onSearch}
            variant="primary"
            style={styles.searchButton}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <AIButtons />
        </Animated.View>

        {history.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Recent Searches</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
              {history.slice(0, 5).map((item, index) => (
                <AnimatedCard
                  key={item.id}
                  variant="elevated"
                  style={styles.historyCard}
                  delay={index * 50}
                  entering={FadeInDown.duration(400).delay(index * 100)}
                  onPress={() => {
                    const recipe = RECIPES.find((r) => r.id === item.id);
                    if (recipe) {
                      setResult(recipe);
                      setShowRecipe(true);
                    }
                  }}>
                  <Ionicons
                    name={item.favorite ? 'heart' : 'heart-outline'}
                    size={16}
                    color={item.favorite ? colors.primary : colors.textLight}
                    style={styles.favoriteIcon}
                  />
                  <ThemedText style={styles.historyText} numberOfLines={2}>
                    {item.title}
                  </ThemedText>
                </AnimatedCard>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  searchCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  buttonContainer: {
    marginBottom: Spacing.md,
  },
  searchButton: {
    width: '100%',
  },
  aiButton: {
    width: '100%',
  },
  historySection: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  historyScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  historyCard: {
    width: 140,
    marginRight: Spacing.md,
    padding: Spacing.md,
    minHeight: 100,
    borderRadius: Radius.lg,
  },
  favoriteIcon: {
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  modalCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  resultCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  scoreBadge: {
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  generateButton: {
    marginTop: Spacing.md,
    width: '100%',
  },
  generatedCard: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  errorText: {
    color: '#FF4444',
    marginBottom: 16,
  },
  recipeCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.lg,
  },
  ingredientsSection: {
    marginBottom: Spacing.lg,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  ingredientBadge: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  instructionsSection: {
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Spacing.md,
  },
  instructionsText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
  },
});
