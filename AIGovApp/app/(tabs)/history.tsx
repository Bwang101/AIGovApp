import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import Storage from '../utils/storage';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RECIPES from '../data/recipes';

type HistoryItem = { id: string; title: string; favorite?: boolean };

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const router = useRouter();
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

  const toggleFavorite = async (id: string) => {
    const newHist = history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h));
    setHistory(newHist);
    await Storage.setItem('@byte_to_bite_history', JSON.stringify(newHist));
  };

  const handleViewRecipe = (item: HistoryItem) => {
    const recipe = RECIPES.find((r) => r.id === item.id);
    if (recipe) {
      router.push(`/?recipe=${item.id}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        key={isFocused ? 'focused' : 'blurred'}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).delay(0)} style={styles.header}>
          <ThemedText type="title" style={styles.titleText}>History</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitleText}>
            Your recent recipe searches
          </ThemedText>
        </Animated.View>

        {history.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <AnimatedCard variant="elevated" style={styles.emptyCard}>
              <Ionicons name="time-outline" size={48} color={colors.textLight} />
              <ThemedText style={styles.emptyText}>No history yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Start searching for recipes to see them here
              </ThemedText>
            </AnimatedCard>
          </Animated.View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
                <AnimatedCard
                  variant="elevated"
                  style={styles.historyCard}
                  delay={index * 50}>
                  <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="restaurant"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <ThemedText style={styles.itemText} numberOfLines={2}>
                        {item.title}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Pressable
                      onPress={() => toggleFavorite(item.id)}
                      style={styles.favoriteButton}>
                      <Ionicons
                        name={item.favorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.favorite ? colors.primary : colors.textGray}
                      />
                    </Pressable>
                    <AnimatedButton
                      title="View"
                      onPress={() => handleViewRecipe(item)}
                      variant="primary"
                      size="small"
                      style={styles.viewButton}
                    />
                  </View>
                </View>
                </AnimatedCard>
              </Animated.View>
            )}
          />
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
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    borderRadius: Radius.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  viewButton: {
    minWidth: 70,
  },
});
