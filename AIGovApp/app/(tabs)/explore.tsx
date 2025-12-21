import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import RECIPES, { Recipe } from '../data/recipes';
import { Colors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2; // 2 columns with padding

export default function ExploreScreen() {
  const [randomRecipes, setRandomRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Get 6 random recipes on load
    const shuffled = [...RECIPES].sort(() => Math.random() - 0.5);
    setRandomRecipes(shuffled.slice(0, 6));
  }, []);

  const refreshRecipes = () => {
    const shuffled = [...RECIPES].sort(() => Math.random() - 0.5);
    setRandomRecipes(shuffled.slice(0, 6));
    setSelectedRecipe(null);
  };

  const renderRecipeCard = ({ item, index }: { item: Recipe; index: number }) => (
    <AnimatedCard
      variant="elevated"
      style={styles.recipeCard}
      delay={index * 50}
      entering={FadeInDown.duration(400).delay(index * 100)}
      onPress={() => setSelectedRecipe(item)}>
      <View style={styles.cardImagePlaceholder}>
        <Ionicons name="restaurant" size={32} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" style={styles.recipeName} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <View style={styles.cardFooter}>
          <Badge label={`${item.ingredients.length} items`} variant="accent" />
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </View>
      </View>
    </AnimatedCard>
  );

  if (selectedRecipe) {
    return (
      <ThemedView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <AnimatedButton
            title="← Back"
            onPress={() => setSelectedRecipe(null)}
            variant="outline"
            size="small"
          />
        </View>
        <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
          <AnimatedCard variant="elevated" style={styles.detailCard} entering={FadeIn.duration(400)}>
            <View style={styles.detailImagePlaceholder}>
              <Ionicons name="restaurant" size={48} color={colors.primary} />
            </View>
            <ThemedText type="title" style={styles.detailTitle}>{selectedRecipe.title}</ThemedText>
            
            <View style={styles.ingredientsSection}>
              <ThemedText style={styles.sectionLabel}>Ingredients</ThemedText>
              <View style={styles.ingredientsList}>
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <Badge key={idx} label={ing} variant="gray" style={styles.ingredientBadge} />
                ))}
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <ThemedText style={styles.sectionLabel}>Instructions</ThemedText>
              <ThemedText style={styles.detailText}>{selectedRecipe.instructions}</ThemedText>
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
          <ThemedText type="title" style={styles.titleText}>Explore Recipes</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitleText}>
            Discover delicious recipes
          </ThemedText>
        </Animated.View>

        <FlatList
          data={randomRecipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
        />

        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <AnimatedButton
            title="Refresh Recipes"
            onPress={refreshRecipes}
            variant="primary"
            style={styles.refreshButton}
          />
        </Animated.View>
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
    marginBottom: Spacing.lg,
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
  listContent: {
    paddingBottom: Spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  recipeCard: {
    width: CARD_WIDTH,
    padding: 0,
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFE5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: Spacing.md,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Spacing.sm,
    minHeight: 40,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  detailHeader: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: Spacing.lg,
  },
  detailCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  detailImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFE5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  ingredientsSection: {
    paddingHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Spacing.md,
  },
  detailText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
  },
  refreshButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
});
