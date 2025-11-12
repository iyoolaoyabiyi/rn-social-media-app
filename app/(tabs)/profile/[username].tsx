import { AppContainer } from '@/src/components/AppContainer';
import { PostCard } from '@/src/components/PostCard';
import { supabase } from '@/src/lib/supabase';
import type { Post } from '@/src/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

  const [userProfile, setUserProfile] = useState<ProfileLite | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1) Resolve profile by username
      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .single();

      if (pErr || !pData) {
        setError(pErr?.message || 'User not found.');
        setLoading(false);
        return;
      }

      if (cancelled) return;

      const prof: ProfileLite = {
        id: pData.id,
        username: pData.username,
        display_name: pData.display_name,
        avatar_url: pData.avatar_url,
      };
      setUserProfile(prof);
      setLoading(false);

      // 2) Fetch posts by that user
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

      if (postsErr) {
        setError(postsErr.message);
        setPosts([]);
      } else {
        const mapped: Post[] = (postsData || []).map((row: any) => ({
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
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [username]);

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
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}>
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
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Posts
          </Text>

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
