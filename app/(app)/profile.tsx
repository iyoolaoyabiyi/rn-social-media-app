import { Pressable, Text, View } from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();

  if (!session) {
    // In practice, the parent layout already guards this.
    return null;
  }

  return (
    <AppContainer>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '600' }}>
          Profile
        </Text>

        <Text>
          Username: {profile?.username}
        </Text>

        {profile?.display_name ? (
          <Text>
            Display name: {profile.display_name}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
            Account (private)
          </Text>
          <Text style={{ fontSize: 14 }}>
            Email: {session.user.email}
          </Text>
        </View>

        <Pressable
          onPress={signOut}
          style={{
            marginTop: 24,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: '#111827',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff' }}>
            Sign out
          </Text>
        </Pressable>
      </View>
    </AppContainer>
  );
}
