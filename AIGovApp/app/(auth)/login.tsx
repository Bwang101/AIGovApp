import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Storage from '../utils/storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const router = useRouter();

  const onLogin = async () => {
    // simple local "login" — store username
    if (!user) return;
    await Storage.setItem('@byte_to_bite_user', JSON.stringify({ username: user }));
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.titleText}>Sign in</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={user}
        onChangeText={setUser}
        placeholderTextColor="#a8c7ba"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={pass}
        onChangeText={setPass}
        secureTextEntry
        placeholderTextColor="#a8c7ba"
      />
      <Pressable style={styles.button} onPress={onLogin}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>Sign in</ThemedText>
      </Pressable>
      <ThemedText style={styles.linkText}>
        Don't have an account?{' '}
        <ThemedText style={styles.link} onPress={() => router.push('/(auth)/signup')}>
          Sign up
        </ThemedText>
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12, backgroundColor: '#e9f8f0' },
  titleText: { color: '#000' },
  input: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#053b2a',
    color: '#e6fff2',
    borderWidth: 1,
    borderColor: '#0f5132',
  },
  button: { marginTop: 8, padding: 12, backgroundColor: '#0f5132', borderRadius: 8 },
  buttonText: { color: '#fff' },
  linkText: { color: '#222', marginTop: 12 },
  link: { color: '#0f5132', fontWeight: 'bold' },
});
