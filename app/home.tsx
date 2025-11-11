import { AppContainer } from '@/src/components/AppContainer';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function HomeScreen() {
  const { loading, session, profile, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    router.replace('/login');
    return null;
  }

  return (
    <AppContainer>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>
          Welcome to Framez
        </Text>
        <Text>
          Signed in as {profile?.display_name || 'unknown user'}
        </Text>

        <Pressable
          onPress={signOut}
          style={{
            marginTop: 16,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: '#111827',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff' }}>Sign out</Text>
        </Pressable>
      </View>
    </AppContainer>
  );
}
