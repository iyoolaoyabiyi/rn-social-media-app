import { AppContainer } from '@/src/components/AppContainer';
import { ProfileView } from '@/src/components/ProfileView';
import { useAuth } from '@/src/context/AuthContext';
import { useRefresh } from '@/src/context/RefreshContext';
import { fetchLikeMetadata } from '@/src/lib/likes';
import { supabase } from '@/src/lib/supabase';
import type { Post } from '@/src/types';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type ProfileLite = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function OtherUserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
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
        <ProfileView
          isSelf={false}
          profile={{
            id: userProfile?.id ?? '',
            username: userProfile?.username ?? '',
            display_name: userProfile?.display_name ?? null,
            avatar_url: userProfile?.avatar_url ?? null,
          }}
          posts={null}
          loadingPosts={false}
        />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ProfileView
        isSelf={false}
        profile={{
          id: userProfile.id,
          username: userProfile.username,
          display_name: userProfile.display_name,
          avatar_url: userProfile.avatar_url,
        }}
        posts={posts}
        loadingPosts={loadingPosts}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onManualRefresh={onRefresh}
      />
    </AppContainer>
  );
}
