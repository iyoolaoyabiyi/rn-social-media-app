import { AppContainer } from '@/src/components/AppContainer';
import { PostCard } from '@/src/components/PostCard';
import { useAuth } from '@/src/context/AuthContext';
import { useRefresh } from '@/src/context/RefreshContext';
import { fetchLikeMetadata } from '@/src/lib/likes';
import { supabase } from '@/src/lib/supabase';
import type { Post } from '@/src/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type ProfileLite = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function OtherUserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { profile: viewerProfile } = useAuth();
  const { refreshToken, triggerRefresh } = useRefresh('posts');

  const [userProfile, setUserProfile] = useState<ProfileLite | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadProfileAndPosts = useCallback(
    async (isRefresh = false) => {
      if (!username) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .single();

      if (!isMounted.current) return;

      if (pErr || !pData) {
        setError(pErr?.message || 'User not found.');
        setUserProfile(null);
        setPosts([]);
        setLoading(false);
        setRefreshing(false);
        setLoadingPosts(false);
        return;
      }

      const prof: ProfileLite = {
        id: pData.id,
        username: pData.username,
        display_name: pData.display_name,
        avatar_url: pData.avatar_url,
      };
      setUserProfile(prof);
      if (!isRefresh) {
        setLoading(false);
      }

      setLoadingPosts(true);
      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select(
          `
            id,
            content,
            image_url,
            created_at,
            user_id,
            profiles (
              username,
              display_name,
              avatar_url
            )
          `
        )
        .eq('user_id', prof.id)
        .order('created_at', { ascending: false });

      if (!isMounted.current) return;

      if (postsErr) {
        setError(postsErr.message);
        setPosts([]);
      } else {
        const basePosts: Post[] = (postsData || []).map((row: any) => ({
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
          viewerProfile?.id
        );

        if (!isMounted.current) return;

        const mapped = basePosts.map((post) => ({
          ...post,
          likes_count: counts[post.id] ?? 0,
          liked_by_me: likedSet.has(post.id),
        }));

        setPosts(mapped);
      }

      setLoadingPosts(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    },
    [username, viewerProfile?.id]
  );

  useEffect(() => {
    loadProfileAndPosts();
  }, [loadProfileAndPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerRefresh();
  }, [triggerRefresh]);

  const skipFirstRefresh = useRef(true);
  useEffect(() => {
    if (skipFirstRefresh.current) {
      skipFirstRefresh.current = false;
      return;
    }

    let active = true;
    setRefreshing(true);

    (async () => {
      await loadProfileAndPosts(true);
      if (active) {
        setRefreshing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadProfileAndPosts, refreshToken]);

  if (loading) {
    return (
      <AppContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      </AppContainer>
    );
  }

  if (error || !userProfile) {
    return (
      <AppContainer>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ color: 'red', marginBottom: 12 }}>
            {error || 'User not found.'}
          </Text>
          <Text onPress={() => router.back()} style={{ color: '#2563EB' }}>
            Go back
          </Text>
        </ScrollView>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {userProfile.avatar_url ? (
          <Image
            source={{ uri: userProfile.avatar_url }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        ) : (
          <View style={styles.avatarStub} />
        )}

        <Text style={{ fontSize: 22, fontWeight: '600' }}>
          {userProfile.display_name || userProfile.username}
        </Text>
        <Text style={{ color: '#6B7280' }}>@{userProfile.username}</Text>

        <View style={{ marginTop: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              Posts
            </Text>
            <Pressable
              onPress={onRefresh}
              disabled={refreshing || loadingPosts}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                opacity: refreshing || loadingPosts ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 12, color: '#111827' }}>Refresh</Text>
            </Pressable>
          </View>

          {loadingPosts && <ActivityIndicator style={{ marginTop: 8 }} />}

          {posts && posts.length === 0 && !loadingPosts && (
            <Text style={{ color: '#6B7280' }}>
              No posts yet.
            </Text>
          )}

          {posts && posts.map((post) => <PostCard key={post.id} post={post} />)}
        </View>
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  avatarStub: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
  },
});
