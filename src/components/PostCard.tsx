import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';

type Props = { post: Post };

export function PostCard({ post }: Props) {
  const { author } = post;
  const created = new Date(post.created_at);
  const timestamp = created.toLocaleString();

  const { profile } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const isOwner = !!profile?.id && profile.id === post.user_id;

  const confirmDelete = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return window.confirm('Are you sure you want to delete this post?');
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return;

    const confirmed = await confirmDelete();
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', profile!.id); 

      if (error) {
        console.error('Error deleting post:', error.message);
        if (Platform.OS === 'web') {
          alert('Could not delete post.');
        } else {
          Alert.alert('Error', 'Could not delete post.');
        }
        return;
      }

      setVisible(false);
    } catch (err) {
      console.error('Unexpected error deleting post:', err);
      if (Platform.OS === 'web') {
        alert('Something went wrong.');
      } else {
        Alert.alert('Error', 'Something went wrong.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {author.avatar_url ? (
            <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarStub} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.username}>
              {author.display_name || author.username}
            </Text>
            <Text style={styles.handle}>@{author.username}</Text>
          </View>
        </View>

        {isOwner && (
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.deleteButton,
              (pressed || isDeleting) && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={isDeleting ? '#9CA3AF' : '#EF4444'}
            />
          </Pressable>
        )}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <Text style={styles.meta}>{timestamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarStub: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  headerText: {
    flexDirection: 'column',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  handle: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    fontSize: 14,
    color: '#111827',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    objectFit: 'contain',
  },
  meta: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 6,
  },
});
