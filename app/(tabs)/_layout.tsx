import { AppContainer } from '@/src/components/AppContainer';
import { useNotificationContext } from '@/src/context/NotificationContext';
import { useRefresh } from '@/src/context/RefreshContext';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function AppTabsLayout() {
  const { session, loading } = useAuth();
  const { unreadCount, setUnreadCount, lastReadAt } = useNotificationContext();
  const { refreshToken: notificationsRefreshToken } = useRefresh('notifications');
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;

    async function loadNotificationCount() {
      const sinceIso = lastReadAt.toISOString();
      const { count, error } = await supabase
        .from('post_likes')
        .select('id, posts!inner(user_id)', { head: true, count: 'exact' })
        .eq('posts.user_id', session.user.id)
        .gt('created_at', sinceIso);

      if (error) {
        console.log('Notification count error:', error.message);
        if (!cancelled) setUnreadCount(0);
        return;
      }

      if (!cancelled) {
        setUnreadCount(count ?? 0);
      }
    }

    loadNotificationCount();
    const interval = setInterval(() => {
      loadNotificationCount();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user?.id, notificationsRefreshToken, lastReadAt, setUnreadCount]);

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
          tabBarActiveTintColor: '#111827',
          tabBarInactiveTintColor: '#9CA3AF',
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarBadge: unreadCount > 0 ? ' ' : undefined,
            tabBarBadgeStyle: {
              minWidth: 8,
              minHeight: 8,
              paddingHorizontal: 0,
              backgroundColor: '#EF4444',
            },
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/edit"
          options={{
            href: null, 
          }}
        />
        <Tabs.Screen
          name="profile/[username]"
          options={{
            href: null, 
          }}
        />
      </Tabs>
    </AppContainer>
  );
}
