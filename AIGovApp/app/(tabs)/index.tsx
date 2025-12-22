import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Text } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import { RecipeCard } from '@/components/recipe-card';
import RECIPES, { Recipe } from '../data/recipes';
import { searchRecipes } from '../lib/recipeApi';
import Storage from '../utils/storage';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

function getDefaultBase() {
  const extras = (Constants.expoConfig && (Constants.expoConfig as any).extra) || (Constants.manifest && (Constants.manifest as any).extra) || {};
  if (extras && extras.RECIPE_API_BASE) return extras.RECIPE_API_BASE as string;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

type HistoryItem = {
  id: string;
  title: string;
  favorite?: boolean;
};

type SearchResult = {
  score: number;
  id?: number;
  title: string;
  ingredients: string;
  instructions: string;
};

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showRecipe, setShowRecipe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isFocused = useIsFocused();

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

  const onSearch = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearchResults([]);
    
    try {
      const baseUrl = getDefaultBase();
      const response = await searchRecipes(input.trim(), 10, baseUrl);
      
      if (response.results && response.results.length > 0) {
        setSearchResults(response.results);
        setResult(response.results[0]);
        setShowRecipe(true);
        
        const newItem: HistoryItem = { 
          id: `recipe-${response.results[0].id || response.results[0].title}`, 
          title: response.results[0].title, 
          favorite: false 
        };
        
        const existing = history.find((h) => h.id === newItem.id);
        let newHist = history.slice();
        if (!existing) newHist = [newItem, ...newHist];
        else {
          newHist = [existing, ...history.filter((h) => h.id !== existing.id)];
        }
        await saveHistory(newHist.slice(0, 50));
      } else {
        setError('No recipes found. Try different ingredients.');
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to search recipes';
      if (errorMsg.includes('fetch') || errorMsg.includes('Network')) {
        setError('Cannot connect to server. Make sure the server is running on http://localhost:8080');
      } else {
        setError(errorMsg);
      }
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    const newHist = history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h));
    await saveHistory(newHist);
  };

  if (showRecipe && result) {
    const ingredientsList = typeof result.ingredients === 'string' 
      ? result.ingredients.split(',').map(i => i.trim()).filter(Boolean)
      : Array.isArray(result.ingredients) ? result.ingredients : [];
    
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
          {searchResults.length > 1 && (
            <View style={styles.resultsHeader}>
              <ThemedText style={styles.resultsCount}>
                Found {searchResults.length} recipes (showing best match)
              </ThemedText>
            </View>
          )}
          
          <AnimatedCard variant="elevated" style={styles.recipeCard}>
            <ThemedText type="title" style={styles.recipeTitle}>{result.title}</ThemedText>
            {result.score !== undefined && (
              <Badge label={`Match: ${(result.score * 100).toFixed(1)}%`} variant="accent" style={styles.scoreBadge} />
            )}
            
            <View style={styles.ingredientsSection}>
              <ThemedText style={styles.sectionLabel}>Ingredients</ThemedText>
              <View style={styles.ingredientsList}>
                {ingredientsList.map((ing: string, idx: number) => (
                  <Badge key={idx} label={ing} variant="gray" style={styles.ingredientBadge} />
                ))}
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <ThemedText style={styles.sectionLabel}>Instructions</ThemedText>
              <ThemedText style={styles.instructionsText}>{result.instructions}</ThemedText>
            </View>
          </AnimatedCard>
          
          {searchResults.length > 1 && (
            <View style={styles.otherResultsSection}>
              <ThemedText style={styles.sectionLabel}>Other Matches</ThemedText>
              {searchResults.slice(1, 6).map((r, idx) => (
                <AnimatedCard 
                  key={idx} 
                  variant="elevated" 
                  style={styles.otherRecipeCard}
                  onPress={() => {
                    setResult(r);
                    setShowRecipe(true);
                  }}>
                  <ThemedText style={styles.otherRecipeTitle}>{r.title}</ThemedText>
                  <Badge label={`${(r.score * 100).toFixed(1)}% match`} variant="gray" />
                </AnimatedCard>
              ))}
            </View>
          )}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        key={isFocused ? 'focused' : 'blurred'}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).delay(0)}>
          <ThemedText type="defaultSemiBold" style={[styles.appLabel, { color: '#27AE60' }]}>Byte to Bite</ThemedText>
        </Animated.View>
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
            title={loading ? "Searching..." : "Find Recipe"}
            onPress={onSearch}
            variant="primary"
            style={styles.searchButton}
            loading={loading}
            disabled={loading}
          />
          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}
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
                  onPress={async () => {
                    const recipe = RECIPES.find((r) => r.id === item.id);
                    if (recipe) {
                      setResult({
                        title: recipe.title,
                        ingredients: recipe.ingredients.join(', '),
                        instructions: recipe.instructions,
                        score: 1.0
                      });
                      setShowRecipe(true);
                    } else {
                      try {
                        const baseUrl = getDefaultBase();
                        const response = await searchRecipes(item.title, 5, baseUrl);
                        if (response.results && response.results.length > 0) {
                          setResult(response.results[0]);
                          setSearchResults(response.results);
                          setShowRecipe(true);
                        }
                      } catch (e) {
                        console.error('Error loading recipe:', e);
                      }
                    }
                  }}>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(item.id)}>
                    <Ionicons
                      name={item.favorite ? 'heart' : 'heart-outline'}
                      size={16}
                      color={item.favorite ? colors.primary : colors.textLight}
                    />
                  </TouchableOpacity>
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
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.sm,
    textAlign: 'center',
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
  historySection: {
    marginTop: Spacing.xl,
  },
  appLabel: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.lg,
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
  favoriteButton: {
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
  resultsHeader: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  scoreBadge: {
    marginBottom: Spacing.md,
  },
  otherResultsSection: {
    marginTop: Spacing.lg,
  },
  otherRecipeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
  },
  otherRecipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Spacing.xs,
  },
  errorText: {
    color: '#FF4444',
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: 'center',
  },
});
