// src/components/ProfileView.tsx
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Post } from '../types';
import { PostCard } from './PostCard';

type BaseProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Props = {
  isSelf: boolean;
  profile: BaseProfile;
  posts: Post[] | null;
  loadingPosts?: boolean;
  sessionEmail?: string | null;
  onPressEdit?: () => void;
  onPressSignOut?: () => void;
};

export function ProfileView({
  isSelf,
  profile,
  posts,
  loadingPosts = false,
  sessionEmail = null,
  onPressEdit,
  onPressSignOut,
}: Props) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40 }} />
      ) : (
        <View style={styles.avatarStub} />
      )}

      <Text style={{ fontSize: 22, fontWeight: '600' }}>
        {profile.display_name || profile.username}
      </Text>
      <Text style={{ color: '#6B7280' }}>@{profile.username}</Text>

      {isSelf && (
        <>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
              Account (private)
            </Text>
            <Text style={{ fontSize: 13, color: '#4B5563' }}>
              Email: {sessionEmail || '—'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable onPress={onPressEdit} style={styles.button}>
              <Text style={{ color: '#fff' }}>Edit profile</Text>
            </Pressable>
            <Pressable onPress={onPressSignOut} style={[styles.button, { backgroundColor: 'red' }]}>
              <Text style={{ color: '#fff' }}>Sign out</Text>
            </Pressable>
          </View>
        </>
      )}

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          {isSelf ? 'Your posts' : 'Posts'}
        </Text>

        {loadingPosts && <ActivityIndicator style={{ marginTop: 8 }} />}

        {posts && posts.length === 0 && !loadingPosts && (
          <Text style={{ color: '#6B7280' }}>
            {isSelf ? 'You have not posted anything yet.' : 'No posts yet.'}
          </Text>
        )}

        {posts && posts.map((post) => <PostCard key={post.id} post={post} />)}
      </View>
    </ScrollView>
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
  },
  avatarStub: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#878c96ff',
  },
});
