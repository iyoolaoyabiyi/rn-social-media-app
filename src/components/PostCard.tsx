import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { likePost, unlikePost } from '../lib/likes';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';

type Props = { post: Post };

export function PostCard({ post }: Props) {
  const router = useRouter();
  const { author } = post;
  const created = new Date(post.created_at);
  const timestamp = created.toLocaleString();

  const { profile } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count ?? 0);
  const [likedByMe, setLikedByMe] = useState<boolean>(post.liked_by_me ?? false);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    setLikesCount(post.likes_count ?? 0);
    setLikedByMe(post.liked_by_me ?? false);
  }, [post.likes_count, post.liked_by_me]);

  if (!visible) return null;

  const isOwner = !!profile?.id && profile.id === post.user_id;

  const openAuthorProfile = () => {
    if (isOwner) {
      router.push('/profile');
      return;
    }
    router.push({
      pathname: '/profile/[username]',
      params: { username: author.username },
    });
  };

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
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
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
        if (Platform.OS === 'web') {
          alert('Could not delete post.');
        } else {
          Alert.alert('Error', 'Could not delete post.');
        }
        return;
      }
      setVisible(false);
    } catch (err) {
      if (Platform.OS === 'web') {
        alert(`Something went wrong.  ${err}`);
      } else {
        Alert.alert('Error', `Something went wrong.  ${err}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!profile?.id || likeBusy) return;

    const nextLiked = !likedByMe;
    const optimisticCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));

    setLikedByMe(nextLiked);
    setLikesCount(optimisticCount);
    setLikeBusy(true);

    try {
      const { error } = nextLiked
        ? await likePost(post.id, profile.id)
        : await unlikePost(post.id, profile.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      // Revert optimistic update on failure
      setLikedByMe(!nextLiked);
      setLikesCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
      if (Platform.OS === 'web') {
        alert('Could not update like.');
      } else {
        Alert.alert('Error', 'Could not update like.');
      }
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={openAuthorProfile}
          style={styles.headerLeft}
          accessibilityRole="button"
          accessibilityLabel={`Open ${author.display_name || author.username}'s profile`}
        >
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
        </Pressable>

        {isOwner && (
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.iconBtn,
              (pressed || isDeleting) && { opacity: 0.6 },
            ]}
            accessibilityLabel="Delete post"
            accessibilityHint="Deletes this post permanently"
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
        <Pressable
          onPress={() => setShowImage(true)}
          style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          accessibilityRole="imagebutton"
          accessibilityLabel="Open image"
        >
          <Image
            source={{ uri: post.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>
      )}

      <Text style={styles.meta}>{timestamp}</Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleToggleLike}
          disabled={likeBusy || !profile?.id}
          style={({ pressed }) => [
            styles.iconBtn,
            styles.likeButton,
            (pressed || likeBusy) && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={likedByMe ? 'Remove like' : 'Like post'}
        >
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={likedByMe ? '#EF4444' : '#4B5563'}
          />
          <Text style={styles.likeCount}>{likesCount}</Text>
        </Pressable>
      </View>

      {/* Full-screen image modal */}
      <Modal
        visible={showImage}
        transparent={false}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowImage(false)}
      >
        <View style={styles.modalRoot}>
          {/* Close button */}
          <Pressable
            onPress={() => setShowImage(false)}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityLabel="Close image"
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>

          {/* Dark backdrop + centered image with zoom on iOS */}
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowImage(false)}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              // Pinch-to-zoom works on iOS; ignored elsewhere gracefully
              minimumZoomScale={1}
              maximumZoomScale={4}
              bouncesZoom
              centerContent
            >
              <Image
                source={{ uri: post.image_url ?? '' }}
                style={styles.modalImage}
                resizeMode="contain"
                // On web, allow right-click save/open in new tab
                accessible
                accessibilityLabel="Expanded post image"
              />
            </ScrollView>
          </Pressable>
        </View>
      </Modal>
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
    flexShrink: 1,
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
    objectFit: 'cover',
  },
  meta: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  iconBtn: {
    padding: 4,
    borderRadius: 6,
  },
  actionsRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  // Modal styles
  modalRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 24, 39, 0.6)', // near-black
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
