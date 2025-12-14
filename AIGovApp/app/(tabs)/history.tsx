import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Storage from '../utils/storage';
import { useRouter } from 'expo-router';

type HistoryItem = { id: string; title: string; favorite?: boolean };

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const router = useRouter();

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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.titleText}>History</ThemedText>
      <FlatList
        data={history}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <ThemedText style={styles.itemText}>{item.title}</ThemedText>
            <View style={styles.rowRight}>
              <Pressable onPress={() => toggleFavorite(item.id)} style={styles.star}>
                <ThemedText style={styles.starText}>{item.favorite ? '★' : '☆'}</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push(`/?recipe=${item.id}`)} style={styles.viewBtn}>
                <ThemedText type="defaultSemiBold" style={styles.viewBtnText}>View</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#e9f8f0' },
  titleText: { color: '#000', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f7fff9', marginBottom: 8, borderRadius: 8 },
  itemText: { color: '#222', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  star: { padding: 8 },
  starText: { color: '#0f5132', fontSize: 16 },
  viewBtn: { padding: 8, backgroundColor: '#0f5132', borderRadius: 6 },
  viewBtnText: { color: '#fff' },
});
