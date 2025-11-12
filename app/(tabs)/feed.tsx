import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';
import { PostCard } from '../../src/components/PostCard';
import { useAuth } from '../../src/context/AuthContext';
import { useRefresh } from '../../src/context/RefreshContext';
import { fetchLikeMetadata } from '../../src/lib/likes';
import { supabase } from '../../src/lib/supabase';
import type { Post } from '../../src/types';

export default function FeedScreen() {
  const { profile } = useAuth();
  const { refreshToken, triggerRefresh } = useRefresh('posts');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipFirstRefresh = useRef(true);

  const fetchPosts = useCallback(async () => {
    setError(null);

    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        id,
        content,
        image_url,
        created_at,
        user_id,
        profiles:profiles!posts_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setPosts([]);
      return;
    }

    const basePosts: Post[] = (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      image_url: row.image_url,
      created_at: row.created_at,
      user_id: row.user_id,
      author: {
        username: row.profiles?.username ?? 'unknown',
        display_name: row.profiles?.display_name ?? null,
        avatar_url: row.profiles?.avatar_url ?? null,
      },
      likes_count: 0,
      liked_by_me: false,
    }));

    const { counts, likedSet } = await fetchLikeMetadata(
      basePosts.map((post) => post.id),
      profile?.id
    );

    const mapped: Post[] = basePosts.map((post) => ({
      ...post,
      likes_count: counts[post.id] ?? 0,
      liked_by_me: likedSet.has(post.id),
    }));

    setPosts(mapped);
  }, [profile?.id]);

  // Refetch whenever the Feed screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        setLoading(true);
        if (isActive) {
          await fetchPosts();
          setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [fetchPosts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerRefresh();
  }, [triggerRefresh]);

  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    triggerRefresh();
  }, [triggerRefresh]);

  useEffect(() => {
    if (skipFirstRefresh.current) {
      skipFirstRefresh.current = false;
      return;
    }

    let isMounted = true;
    setRefreshing(true);

    (async () => {
      await fetchPosts();
      if (isMounted) {
        setRefreshing(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts, refreshToken]);

  return (
    <AppContainer>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '600' }}>
            Global Feed
          </Text>
          <Pressable
            onPress={handleManualRefresh}
            disabled={loading || refreshing}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              opacity: loading || refreshing ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 13, color: '#111827' }}>
              Refresh
            </Text>
          </Pressable>
        </View>

        {loading && !posts && (
          <ActivityIndicator style={{ marginTop: 16 }} />
        )}

        {error && (
          <Text style={{ color: 'red', marginBottom: 12 }}>
            {error}
          </Text>
        )}

        {posts && posts.length === 0 && !loading && !error && (
          <Text style={{ color: '#6B7280' }}>
            No posts yet. Be the first to create one.
          </Text>
        )}

        {posts &&
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
      </ScrollView>
    </AppContainer>
  );
}
