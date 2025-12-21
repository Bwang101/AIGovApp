import React from 'react';
import { StyleSheet, View, Button } from 'react-native';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DebugScreen() {
  const extras = (Constants.expoConfig && (Constants.expoConfig as any).extra) || (Constants.manifest && (Constants.manifest as any).extra) || {};
  const apiBase = extras.RECIPE_API_BASE || (Constants.manifest && (Constants.manifest as any).extra?.RECIPE_API_BASE) || 'not set';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Debug</ThemedText>
      <ThemedText style={styles.label}>Resolved Recipe API Base:</ThemedText>
      <ThemedText style={styles.value}>{apiBase}</ThemedText>
      <View style={{ height: 12 }} />
      <Button title="Copy to clipboard" onPress={async () => {
        try {
          await (navigator as any)?.clipboard?.writeText(apiBase);
          // silent
        } catch {
          // ignore
        }
      }} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#e9f8f0' },
  title: { fontSize: 20, marginBottom: 8 },
  label: { fontSize: 14, marginTop: 8, color: '#333' },
  value: { fontSize: 14, marginTop: 4, color: '#0f5132' },
});