import { AppContainer } from '@/src/components/AppContainer';
import { useAuth } from '@/src/context/AuthContext';
import { useNotificationContext } from '@/src/context/NotificationContext';
import { useRefresh } from '@/src/context/RefreshContext';
import { Heading, Body, Caption } from '@/src/components/Typography';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
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
  const { refreshToken } = useRefresh('notifications');
  const { markAsRead } = useNotificationContext();
  const skipFirstRefresh = useRef(true);

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
    async (markRead = false, isRefresh = false) => {
      if (!profile?.id) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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
        .limit(80);

      if (error) {
        console.log('Notifications error:', error.message);
        setError(error.message);
        setNotifications([]);
      } else {
        const aggregated = aggregateRows(data || []);
        setNotifications(aggregated);

        if (markRead) {
          const latest = aggregated[0]?.latest_like
            ? new Date(aggregated[0].latest_like)
            : new Date();
          markAsRead(latest);
        }
      }

      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    },
    [profile?.id, markAsRead]
  );

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      loadNotifications(true);
    }, [loadNotifications, profile?.id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(true, true);
  }, [loadNotifications]);

  useEffect(() => {
    if (skipFirstRefresh.current) {
      skipFirstRefresh.current = false;
      return;
    }

    let active = true;
    setRefreshing(true);

    (async () => {
      await loadNotifications(false, true);
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <Heading>Notifications</Heading>
          <Pressable
            onPress={() => loadNotifications(true, true)}
            disabled={loading || refreshing}
            style={({ pressed }) => [
              styles.refreshBtn,
              (pressed && !(loading || refreshing)) && { opacity: 0.75 },
              (loading || refreshing) && { opacity: 0.6 },
            ]}
          >
            <Caption style={styles.refreshText}>Mark as read</Caption>
          </Pressable>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

        {error && (
          <Body style={styles.errorText}>
            {error}
          </Body>
        )}

        {!loading && (!notifications || notifications.length === 0) && (
          <Body style={styles.emptyText}>
            You&apos;re all caught up. No unread likes right now.
          </Body>
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
                  <Body style={styles.cardText}>{summary}</Body>
                  <Caption style={styles.countText}>
                    [{sortedActors.length}] people liked your post
                  </Caption>
                  {!!group.post_content && (
                    <Caption style={styles.postSnippet} numberOfLines={2}>
                      “{group.post_content}”
                    </Caption>
                  )}
                  <Caption style={styles.meta}>
                    {new Date(group.latest_like).toLocaleString()}
                  </Caption>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  refreshText: {
    fontSize: 13,
    color: theme.palette.textMuted,
  },
  errorText: {
    color: theme.palette.accent,
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    color: theme.palette.textMuted,
    marginTop: theme.spacing.sm,
  },
  card: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.palette.border,
    backgroundColor: theme.palette.surface,
    elevation: 1,
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
    backgroundColor: theme.palette.border,
  },
  cardText: {
    color: theme.palette.text,
    fontWeight: '600',
  },
  countText: {
    marginTop: 2,
    fontSize: 12,
    color: theme.palette.textMuted,
  },
  postSnippet: {
    marginTop: 4,
    fontSize: 13,
    color: theme.palette.textMuted,
    fontStyle: 'italic',
  },
  meta: {
    marginTop: 6,
    fontSize: 11,
    color: theme.palette.textSubtle,
  },
});
