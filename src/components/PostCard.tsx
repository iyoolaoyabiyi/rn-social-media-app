import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { likePost, unlikePost } from '../lib/likes';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { Body, Caption, Heading } from './Typography';
import { theme } from '../theme';

type Props = { post: Post };

const imagePlaceholder = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      if (error) throw new Error(error.message);

      await Haptics.selectionAsync();
    } catch (err) {
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
    <Animated.View entering={FadeInUp.springify(90)} style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={openAuthorProfile}
          style={styles.headerLeft}
          accessibilityRole="button"
          accessibilityLabel={`Open ${author.display_name || author.username}'s profile`}
        >
          <Avatar
            uri={author.avatar_url}
            size={38}
            name={author.display_name || author.username}
          />
          <View style={styles.headerText}>
            <Heading style={styles.username}>
              {author.display_name || author.username}
            </Heading>
            <Caption>@{author.username}</Caption>
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
              color={isDeleting ? theme.palette.textSubtle : theme.palette.accent}
            />
          </Pressable>
        )}
      </View>

      <Body style={styles.content}>{post.content}</Body>

      {post.image_url && (
        <Pressable
          onPress={() => setShowImage(true)}
          style={({ pressed }) => [styles.imageWrapper, pressed && { opacity: 0.9 }]}
          accessibilityRole="imagebutton"
          accessibilityLabel="Open image"
        >
          <Image
            source={{ uri: post.image_url }}
            style={styles.image}
            contentFit="cover"
            placeholder={imagePlaceholder}
            transition={400}
          />
        </Pressable>
      )}

      <Caption>{timestamp}</Caption>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleToggleLike}
          disabled={likeBusy || !profile?.id}
          style={({ pressed }) => [
            styles.likeButton,
            (pressed || likeBusy) && { opacity: 0.65 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={likedByMe ? 'Remove like' : 'Like post'}
        >
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={likedByMe ? theme.palette.accent : theme.palette.textMuted}
          />
          <Body style={styles.likeCount}>{likesCount}</Body>
        </Pressable>
      </View>

      <Modal
        visible={showImage}
        transparent={false}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowImage(false)}
      >
        <View style={styles.modalRoot}>
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

          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowImage(false)}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              minimumZoomScale={1}
              maximumZoomScale={4}
              bouncesZoom
              centerContent
            >
              <Image
                source={{ uri: post.image_url ?? '' }}
                style={styles.modalImage}
                contentFit="contain"
                placeholder={imagePlaceholder}
              />
            </ScrollView>
          </Pressable>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.palette.surface,
    gap: theme.spacing.sm,
    shadowColor: '#0f172a22',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  headerText: {
    flexDirection: 'column',
  },
  username: {
    fontSize: 15,
  },
  content: {
    fontSize: 15,
    color: theme.palette.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.palette.textMuted,
  },
  iconBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  imageWrapper: {
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.palette.border,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
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
