import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function IngredientInput({
  onChange,
  placeholder = 'Add ingredient (e.g., chicken)'
}: {
  onChange?: (chips: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const addChip = (value?: string) => {
    const v = (value ?? text).trim();
    if (!v) return;
    const next = [...chips, v];
    setChips(next);
    setText('');
    onChange?.(next);
  };

  const removeChip = (i: number) => {
    const next = chips.filter((_, idx) => idx !== i);
    setChips(next);
    onChange?.(next);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {chips.map((c, i) => (
          <Pressable
            key={i}
            onPress={() => removeChip(i)}
            style={{ backgroundColor: '#fff2e8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
            <Text style={{ color: '#c2410c', fontSize: 12 }}>#{c} ✕</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          placeholder={placeholder}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => addChip()}
          style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, fontSize: 14 }}
        />
        <Pressable onPress={() => addChip()} style={{ marginLeft: 10, backgroundColor: '#fb923c', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 }}>
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
