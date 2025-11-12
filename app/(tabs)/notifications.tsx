import { AppContainer } from '@/src/components/AppContainer';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type LikeNotification = {
  id: string;
  created_at: string;
  post_content: string;
  actor: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<LikeNotification[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('post_likes')
      .select(
        `
        id,
        post_id,
        created_at,
        posts!inner (
          id,
          content,
          user_id
        ),
        actor:profiles!post_likes_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq('posts.user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(40);

    if (error) {
      console.log('Notifications error:', error.message);
      setError(error.message);
      setNotifications([]);
    } else {
      const mapped: LikeNotification[] = (data || []).map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        post_content: row.posts?.content ?? '',
        actor: {
          username: row.actor?.username ?? 'Someone',
          display_name: row.actor?.display_name ?? null,
          avatar_url: row.actor?.avatar_url ?? null,
        },
      }));
      setNotifications(mapped);
    }

    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      fetchNotifications();
    }, [fetchNotifications, profile?.id])
  );

  if (!profile?.id) {
    return (
      <AppContainer>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Notifications</Text>

        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

        {error && (
          <Text style={{ color: 'red', marginTop: 12 }}>
            {error}
          </Text>
        )}

        {!loading && notifications?.length === 0 && (
          <Text style={{ color: '#6B7280', marginTop: 12 }}>
            No likes yet. Once other Framez users interact with your posts,
            they will appear here.
          </Text>
        )}

        {notifications &&
          notifications.map((item) => (
            <View key={item.id} style={styles.card}>
              {item.actor.avatar_url ? (
                <Image
                  source={{ uri: item.actor.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarStub} />
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.cardText}>
                  <Text style={styles.cardUser}>
                    {item.actor.display_name || item.actor.username}
                  </Text>{' '}
                  liked your post
                </Text>
                {!!item.post_content && (
                  <Text style={styles.postSnippet} numberOfLines={2}>
                    “{item.post_content}”
                  </Text>
                )}
                <Text style={styles.meta}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarStub: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  cardText: {
    color: '#111827',
  },
  cardUser: {
    fontWeight: '600',
  },
  postSnippet: {
    marginTop: 4,
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  meta: {
    marginTop: 6,
    fontSize: 11,
    color: '#9CA3AF',
  },
});
