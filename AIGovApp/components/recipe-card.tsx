import React, { useState } from 'react';
import { View, Image, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Recipe {
  id: string | number;
  title: string;
  ingredients: string | string[];
  instructions?: string;
  image_url?: string;
  score?: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const [imageError, setImageError] = useState(false);

  const ingredientList = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.slice(0, 3).map((i) => i.trim()).join(', ')
    : (recipe.ingredients || '')
        .split(',')
        .slice(0, 3)
        .map((ing) => ing.trim())
        .join(', ');

  const moreIngredients = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients.length > 3)
    : (recipe.ingredients || '').split(',').length > 3;

  const matchPercentage = recipe.score !== undefined ? Math.round((recipe.score ?? 0) * 100) : undefined;
  const showImage = !!recipe.image_url && !imageError;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-2xl overflow-hidden bg-white shadow-lg active:opacity-90 relative"
      style={{ elevation: 3 }}
    >
      {/* Image Section */}
      {showImage ? (
        <Image
          source={{ uri: recipe.image_url }}
          className="w-full h-40 bg-gray-300"
          onError={() => setImageError(true)}
          accessibilityLabel={`${recipe.title} image`}
        />
      ) : (
        <View className="w-full h-40 bg-gradient-to-b from-orange-400 to-orange-600 justify-center items-center">
          <Text className="text-5xl">🍽️</Text>
        </View>
      )}

      {/* Match Badge */}
      {matchPercentage !== undefined && (
        <View className="absolute top-3 right-3 bg-green-500 rounded-full px-3 py-1 shadow-md">
          <Text className="text-white text-xs font-bold">{matchPercentage}%</Text>
        </View>
      )}

      {/* Content Section */}
      <View className="p-4">
        {/* Title */}
        <Text className="text-base font-bold text-gray-900 mb-2 leading-5" numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Ingredients */}
        <View className="mb-3 flex-row items-start">
          <Ionicons name="leaf" size={14} color="#f97316" style={{ marginRight: 6, marginTop: 2 }} />
          <Text className="text-xs text-gray-600 flex-1" numberOfLines={2}>
            {ingredientList}
            {moreIngredients && '...'}
          </Text>
        </View>

        {/* Instructions Preview */}
        <View className="flex-row items-start">
          <Ionicons name="document-text" size={14} color="#6b7280" style={{ marginRight: 6, marginTop: 2 }} />
          <Text className="text-xs text-gray-500 flex-1" numberOfLines={1}>
            {(recipe.instructions || 'No instructions').substring(0, 60)}{(recipe.instructions || '').length > 60 ? '...' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
