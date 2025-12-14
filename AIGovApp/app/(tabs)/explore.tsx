import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import RECIPES, { Recipe } from '../data/recipes';

export default function ExploreScreen() {
  const [randomRecipes, setRandomRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    // Get 5 random recipes on load
    const shuffled = [...RECIPES].sort(() => Math.random() - 0.5);
    setRandomRecipes(shuffled.slice(0, 5));
  }, []);

  const refreshRecipes = () => {
    const shuffled = [...RECIPES].sort(() => Math.random() - 0.5);
    setRandomRecipes(shuffled.slice(0, 5));
    setSelectedRecipe(null);
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <Pressable
      style={[styles.card, selectedRecipe?.id === item.id && styles.cardSelected]}
      onPress={() => setSelectedRecipe(item)}>
      <ThemedText type="defaultSemiBold" style={styles.recipeName}>
        {item.title}
      </ThemedText>
      <ThemedText style={styles.cardText} numberOfLines={2}>
        {item.ingredients.join(', ')}
      </ThemedText>
    </Pressable>
  );

  if (selectedRecipe) {
    return (
      <ThemedView style={styles.detailModal}>
        <Pressable onPress={() => setSelectedRecipe(null)} style={styles.backButton}>
          <ThemedText type="defaultSemiBold" style={styles.backText}>← Back</ThemedText>
        </Pressable>
        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
          <ThemedView style={styles.detailBox}>
            <ThemedText type="title" style={styles.detailTitle}>{selectedRecipe.title}</ThemedText>
            <ThemedText style={styles.sectionLabel}>Ingredients:</ThemedText>
            <ThemedText style={styles.detailText}>{selectedRecipe.ingredients.join(', ')}</ThemedText>
            <ThemedText style={styles.sectionLabel}>Instructions:</ThemedText>
            <ThemedText style={styles.detailText}>{selectedRecipe.instructions}</ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.titleText}>Explore Recipes</ThemedText>
      <ThemedText type="subtitle" style={styles.subtitleText}>Discover random recipes</ThemedText>

      <FlatList
        data={randomRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        style={styles.list}
        scrollEnabled={true}
      />

      <Pressable style={styles.refreshButton} onPress={refreshRecipes}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
          Refresh Recipes
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e9f8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  list: {
    width: '100%',
    maxWidth: 560,
    marginBottom: 16,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#f7fff9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0f5132',
  },
  cardSelected: {
    backgroundColor: '#d4f1e4',
    borderLeftColor: '#053b2a',
  },
  recipeName: {
    color: '#000',
    marginBottom: 4,
  },
  cardText: {
    color: '#222',
    fontSize: 12,
  },
  detailModal: {
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
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  detailBox: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#f7fff9',
    borderRadius: 12,
    padding: 20,
  },
  detailTitle: {
    color: '#000',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#000',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
  },
  detailText: {
    color: '#222',
    lineHeight: 22,
    fontSize: 14,
  },
  refreshButton: {
    backgroundColor: '#0f5132',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    width: 160,
  },
  buttonText: {
    color: '#fff',
  },
});

