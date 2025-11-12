import { AppContainer } from '@/src/components/AppContainer';
import { useAuth } from '@/src/context/AuthContext';
import { useNotificationContext } from '@/src/context/NotificationContext';
import { useRefresh } from '@/src/context/RefreshContext';
import { supabase } from '@/src/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Actor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type AggregatedNotification = {
  post_id: string;
  post_content: string;
  actors: Actor[];
  latest_like: string;
};

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AggregatedNotification[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshToken, triggerRefresh } = useRefresh('notifications');
  const { lastReadAt, markAsRead } = useNotificationContext();
  const lastReadAtRef = useRef(lastReadAt);
  const fetchSinceRef = useRef<Date>(lastReadAt);
  const skipFirstRefresh = useRef(true);

  useEffect(() => {
    lastReadAtRef.current = lastReadAt;
  }, [lastReadAt]);

  const aggregateRows = (rows: any[]): AggregatedNotification[] => {
    const map = new Map<string, AggregatedNotification>();

    rows.forEach((row) => {
      const postId = row.post_id;
      const actor: Actor = {
        username: row.actor?.username ?? 'Someone',
        display_name: row.actor?.display_name ?? null,
        avatar_url: row.actor?.avatar_url ?? null,
        created_at: row.created_at,
      };

      const existing = map.get(postId);
      if (!existing) {
        map.set(postId, {
          post_id: postId,
          post_content: row.posts?.content ?? '',
          actors: [actor],
          latest_like: row.created_at,
        });
      } else {
        existing.actors.push(actor);
        if (new Date(row.created_at).getTime() > new Date(existing.latest_like).getTime()) {
          existing.latest_like = row.created_at;
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latest_like).getTime() - new Date(a.latest_like).getTime()
    );
  };

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!profile?.id) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const sinceIso = fetchSinceRef.current.toISOString();

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
        .gt('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) {
        console.log('Notifications error:', error.message);
        setError(error.message);
        setNotifications([]);
      } else {
        const aggregated = aggregateRows(data || []);
        setNotifications(aggregated);
      }

      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    },
    [profile?.id]
  );

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      fetchSinceRef.current = lastReadAtRef.current;
      markAsRead();
      loadNotifications();
    }, [loadNotifications, markAsRead, profile?.id])
  );

  const onRefresh = useCallback(() => {
    fetchSinceRef.current = lastReadAtRef.current;
    markAsRead();
    setRefreshing(true);
    triggerRefresh();
  }, [markAsRead, triggerRefresh]);

  useEffect(() => {
    if (skipFirstRefresh.current) {
      skipFirstRefresh.current = false;
      return;
    }

    let active = true;
    setRefreshing(true);

    (async () => {
      await loadNotifications(true);
      if (active) {
        setRefreshing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadNotifications, refreshToken]);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Notifications</Text>
          <Pressable
            onPress={onRefresh}
            disabled={loading || refreshing}
            style={({ pressed }) => [
              styles.refreshBtn,
              (pressed && !(loading || refreshing)) && { opacity: 0.75 },
              (loading || refreshing) && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

        {error && (
          <Text style={{ color: 'red', marginTop: 12 }}>
            {error}
          </Text>
        )}

        {!loading && (!notifications || notifications.length === 0) && (
          <Text style={{ color: '#6B7280', marginTop: 12 }}>
            You&apos;re all caught up. No unread likes right now.
          </Text>
        )}

        {notifications &&
          notifications.map((group) => {
            const sortedActors = [...group.actors].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
            const primaryNames = sortedActors
              .slice(0, 2)
              .map((actor) => actor.display_name || actor.username);
            let summary = '';
            if (sortedActors.length === 1) {
              summary = `${primaryNames[0]} liked your post`;
            } else if (sortedActors.length === 2) {
              summary = `${primaryNames[0]} and ${primaryNames[1]} liked your post`;
            } else {
              summary = `${primaryNames[0]}, ${primaryNames[1]} and ${
                sortedActors.length - 2
              } other${sortedActors.length - 2 === 1 ? '' : 's'} liked your post`;
            }

            const leadActor = sortedActors[0];

            return (
              <View key={group.post_id} style={styles.card}>
                {leadActor.avatar_url ? (
                  <Image
                    source={{ uri: leadActor.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarStub} />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardText}>{summary}</Text>
                  <Text style={styles.countText}>
                    [{sortedActors.length}] people liked your post
                  </Text>
                  {!!group.post_content && (
                    <Text style={styles.postSnippet} numberOfLines={2}>
                      “{group.post_content}”
                    </Text>
                  )}
                  <Text style={styles.meta}>
                    {new Date(group.latest_like).toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  refreshText: {
    fontSize: 13,
    color: '#111827',
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
    fontWeight: '600',
  },
  countText: {
    marginTop: 2,
    fontSize: 12,
    color: '#4B5563',
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
