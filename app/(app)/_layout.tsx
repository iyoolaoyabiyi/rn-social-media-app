import { AppContainer } from '@/src/components/AppContainer';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function AppTabsLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AppContainer>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </AppContainer>
  );
}
