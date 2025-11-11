// app/login.tsx
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);

    const { error } = await signIn(email.trim(), password);

    setSubmitting(false);

    if (error) {
      setError(error);
      return;
    }

    router.replace('/feed');
  }

  return (
    <AppContainer>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>
          Framez Login
        </Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 8,
          }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 8,
          }}
        />

        {error && (
          <Text style={{ color: 'red', fontSize: 14 }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          style={{
            backgroundColor: '#111827',
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 4,
            opacity: submitting ? 0.8 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '500' }}>Login</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/register')}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: '#111827' }}>
            No account yet? Create one
          </Text>
        </Pressable>
      </View>
    </AppContainer>
  );
}
