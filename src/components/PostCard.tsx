import { View, Text, StyleSheet, Image } from 'react-native';
import type { Post } from '../types';

type Props = {
  post: Post;
};

export function PostCard({ post }: Props) {
  const { author } = post;

  const created = new Date(post.created_at);
  const timestamp = created.toLocaleString();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarStub} />
        <View style={styles.headerText}>
          <Text style={styles.username}>
            {author.display_name || author.username}
          </Text>
          <Text style={styles.handle}>@{author.username}</Text>
        </View>
      </View>

      {post.content ? (
        <Text style={styles.content}>{post.content}</Text>
      ) : null}

      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}

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
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStub: {
    width: 32,
    height: 32,
    borderRadius: 999,
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
  },
  meta: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
