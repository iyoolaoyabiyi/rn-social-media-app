import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';
import { PostCard } from '../../src/components/PostCard';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import type { Post } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, session, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);

  useEffect(() => {
    if (!profile) return;

    async function loadUserPosts() {
      setLoadingPosts(true);
      const { data, error } = await supabase
        .from('posts')
        .select(
          `id,
          content,
          image_url,
          created_at,
          user_id,
          profiles (
            username,
            display_name,
            avatar_url
          )`
        )
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

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

    loadUserPosts();
  }, [profile]);

  if (!session || !profile) {
    return null;
  }

  return (
    <AppContainer>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {profile.avatar_url && (
          <Image
            source={{ uri: profile.avatar_url }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        )}
        <Text style={{ fontSize: 22, fontWeight: '600' }}>
          {profile.display_name || profile.username}
        </Text>
        <Text style={{ color: '#6B7280' }}>@{profile.username}</Text>

        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
            Account (private)
          </Text>
          <Text style={{ fontSize: 13, color: '#4B5563' }}>
            Email: {session.user.email}
          </Text>
        </View>
        <View style={{
          flex: 1,
          flexDirection: "row",
          gap: 6
        }}>
          <Pressable 
            onPress={() => router.push('/edit-profile')}
            style={ styles.button }
          >
            <Text style={{ color: "#fff" }}>Edit profile</Text>
          </Pressable>
          <Pressable
            onPress={signOut}
            style={[
              styles.button,
              {
                backgroundColor: "red"
              }]
            }
          >
            <Text style={{ color: '#fff' }}>Sign out</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Your posts
          </Text>

          {loadingPosts && <ActivityIndicator style={{ marginTop: 8 }} />}

          {posts && posts.length === 0 && !loadingPosts && (
            <Text style={{ color: '#6B7280' }}>
              You have not posted anything yet.
            </Text>
          )}

          {posts &&
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
        </View>
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    alignSelf: 'flex-start',
  }
})