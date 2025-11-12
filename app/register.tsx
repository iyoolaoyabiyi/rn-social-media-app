import { AppContainer } from '@/src/components/AppContainer';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);

    if (!email || !password || !username) {
      setError('Email, username and password are required.');
      return;
    }

    setSubmitting(true);

    const { error } = await signUp({
      email: email.trim(),
      password,
      username: username.trim(),
      displayName: displayName.trim() || undefined,
    });

    if (error) {
      setError(error);
      setSubmitting(false);
      return;
    }

    // After successful sign up, Supabase may require email confirm
    // depending on your settings. For now, route back to login.
    setSubmitting(false);
    router.replace('/login');
  }

  return (
    <AppContainer>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>
          Create your Framez account
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 8,
            color: '#111827',
          }}
        />

        <TextInput
          placeholder="Username (public handle)"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 8,
            color: '#111827',
          }}
        />

        <TextInput
          placeholder="Display name (optional)"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 8,
            color: '#111827',
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 8,
            color: '#111827',
          }}
        />

        {error && (
          <Text style={{ color: 'red', fontSize: 14 }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleRegister}
          disabled={submitting}
          style={{
            backgroundColor: '#111827',
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '500' }}>Sign up</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: '#111827' }}>
            Back to login
          </Text>
        </Pressable>
      </View>
    </AppContainer>
  );
}
