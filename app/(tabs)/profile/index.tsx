// app/(tabs)/profile.tsx
import { AppContainer } from '@/src/components/AppContainer';
import { ProfileView } from '@/src/components/ProfileView';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import type { Post } from '@/src/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, session, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;
    async function loadUserPosts() {
      setLoadingPosts(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, image_url, created_at, user_id,
          profiles ( username, display_name, avatar_url )
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (!cancelled) {
        if (error) {
          console.log('Error loading user posts:', error.message);
          setPosts([]);
        } else {
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
        }
        setLoadingPosts(false);
      }
    }

    loadUserPosts();
    return () => { cancelled = true; };
  }, [profile]);

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
        sessionEmail={session.user.email}
        onPressEdit={() => router.push('/profile/edit')}
        onPressSignOut={signOut}
      />
    </AppContainer>
  );
}
