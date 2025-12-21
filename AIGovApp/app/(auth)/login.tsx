import React, { useState } from 'react';
import { StyleSheet, TextInput, View, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Storage from '../utils/storage';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const onLogin = async () => {
    // simple local "login" — store username
    if (!user) return;
    await Storage.setItem('@byte_to_bite_user', JSON.stringify({ username: user }));
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.titleText}>Sign in</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitleText}>
            Welcome back!
          </ThemedText>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textLight}
              value={user}
              onChangeText={setUser}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Button
            title="Sign in"
            onPress={onLogin}
            variant="primary"
            style={styles.button}
          />

          <View style={styles.linkContainer}>
            <ThemedText style={styles.linkText}>
              Don't have an account?{' '}
              <ThemedText style={styles.link} onPress={() => router.push('/(auth)/signup')}>
                Sign up
              </ThemedText>
            </ThemedText>
          </View>
        </Card>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  card: {
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  link: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
