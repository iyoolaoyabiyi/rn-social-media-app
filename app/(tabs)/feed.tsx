import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
} from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';
import { PostCard } from '../../src/components/PostCard';
import { supabase } from '../../src/lib/supabase';
import type { Post } from '../../src/types';

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const mapped: Post[] = (data || []).map((row: any) => ({
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
    }));

    setPosts(mapped);
  }, []);

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
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  return (
    <AppContainer>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
          Global Feed
        </Text>

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
