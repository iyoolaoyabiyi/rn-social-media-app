import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { PostCard } from './PostCard';
import { SkeletonCard } from './SkeletonCard';
import { Body, Caption, Heading } from './Typography';

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
  onRefresh?: () => void;
  refreshing?: boolean;
  onManualRefresh?: () => void;
};

export function ProfileView({
  isSelf,
  profile,
  posts,
  loadingPosts = false,
  sessionEmail = null,
  onPressEdit,
  onPressSignOut,
  onRefresh,
  refreshing = false,
  onManualRefresh,
}: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <Avatar uri={profile.avatar_url} size={84} name={profile.display_name || profile.username} />
      <Heading style={styles.displayName}>
        {profile.display_name || profile.username}
      </Heading>
      <Caption>@{profile.username}</Caption>

      {isSelf && (
        <>
          <View style={styles.accountBox}>
            <Heading style={styles.accountHeading}>Account (private)</Heading>
            <Body style={styles.accountText}>Email: {sessionEmail || '—'}</Body>
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={onPressEdit} style={styles.primaryBtn}>
              <Body style={styles.primaryBtnText}>Edit profile</Body>
            </Pressable>
            <Pressable onPress={onPressSignOut} style={styles.secondaryBtn}>
              <Body style={styles.secondaryBtnText}>Sign out</Body>
            </Pressable>
          </View>
        </>
      )}

      <View style={styles.postsSection}>
        <View style={styles.postsHeader}>
          <Heading style={styles.postsTitle}>
            {isSelf ? 'Your posts' : 'Posts'}
          </Heading>
          {onManualRefresh && (
            <Pressable
              onPress={onManualRefresh}
              disabled={refreshing}
              style={({ pressed }) => [
                styles.refreshBtn,
                (pressed || refreshing) && { opacity: 0.6 },
              ]}
            >
              <Caption style={styles.refreshText}>Refresh</Caption>
            </Pressable>
          )}
        </View>

        {loadingPosts && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {posts && posts.length === 0 && !loadingPosts && (
          <Body style={styles.emptyText}>
            {isSelf
              ? 'You have not posted anything yet.'
              : 'No posts yet.'}
          </Body>
        )}

        {posts && posts.map((post) => <PostCard key={post.id} post={post} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  displayName: {
    fontSize: 24,
  },
  accountBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  accountHeading: {
    fontSize: 16,
    marginBottom: theme.spacing.xs,
  },
  accountText: {
    color: theme.palette.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.palette.primary,
  },
  primaryBtnText: {
    color: theme.palette.surface,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  secondaryBtnText: {
    color: theme.palette.accent,
    fontWeight: '600',
  },
  postsSection: {
    marginTop: theme.spacing.lg,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  postsTitle: {
    fontSize: 18,
  },
  refreshBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  refreshText: {
    color: theme.palette.textMuted,
  },
  emptyText: {
    color: theme.palette.textMuted,
  },
});
