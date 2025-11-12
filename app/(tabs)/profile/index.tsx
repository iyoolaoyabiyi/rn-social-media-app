// app/(tabs)/profile.tsx
import { AppContainer } from '@/src/components/AppContainer';
import { ProfileView } from '@/src/components/ProfileView';
import { useAuth } from '@/src/context/AuthContext';
import { useRefresh } from '@/src/context/RefreshContext';
import { fetchLikeMetadata } from '@/src/lib/likes';
import { supabase } from '@/src/lib/supabase';
import type { Post } from '@/src/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, session, signOut } = useAuth();
  const { refreshToken, triggerRefresh } = useRefresh('posts');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  const skipFirstRefresh = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPosts = useCallback(
    async (isRefresh = false) => {
      if (!profile?.id) {
        setPosts([]);
        setLoadingPosts(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingPosts(true);
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, image_url, created_at, user_id,
          profiles ( username, display_name, avatar_url )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (!isMounted.current) return;

      if (error) {
        console.log('Error loading user posts:', error.message);
        setPosts([]);
      } else {
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
          profile.id
        );

        if (!isMounted.current) return;

        const mapped = basePosts.map((post) => ({
          ...post,
          likes_count: counts[post.id] ?? 0,
          liked_by_me: likedSet.has(post.id),
        }));

        setPosts(mapped);
      }

      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoadingPosts(false);
      }
    },
    [profile?.id]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerRefresh();
  }, [triggerRefresh]);

  useEffect(() => {
    if (skipFirstRefresh.current) {
      skipFirstRefresh.current = false;
      return;
    }

    let active = true;
    setRefreshing(true);

    (async () => {
      await fetchPosts(true);
      if (active) {
        setRefreshing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchPosts, refreshToken]);

  if (!session || !profile) return <AppContainer><ActivityIndicator /></AppContainer>;

  return (
    <AppContainer>
      <ProfileView
        isSelf
        profile={{
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        }}
        posts={posts}
        loadingPosts={loadingPosts}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onManualRefresh={onRefresh}
        sessionEmail={session.user.email}
        onPressEdit={() => router.push('/profile/edit')}
        onPressSignOut={signOut}
      />
    </AppContainer>
  );
}
