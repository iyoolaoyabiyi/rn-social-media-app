import { supabase } from './supabase';

type LikeMetadata = {
  counts: Record<string, number>;
  likedSet: Set<string>;
};
type PostLikeRow = { post_id: string };

/**
 * Fetch aggregated like counts plus the set of posts liked by a specific user.
 * Falls back gracefully so feed/profile rendering keeps working even if the
 * metadata query fails.
 */
export async function fetchLikeMetadata(
  postIds: string[],
  userId?: string
): Promise<LikeMetadata> {
  if (!postIds.length) {
    return { counts: {}, likedSet: new Set<string>() };
  }

  const counts: Record<string, number> = {};
  const likedSet = new Set<string>();

  try {
    const [{ data: allLikes }, userLikesResult] = await Promise.all([
      supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds),
      userId
        ? supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds)
        : Promise.resolve({ data: null } as { data: PostLikeRow[] | null }),
    ]);

    allLikes?.forEach((row: PostLikeRow) => {
      counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
    });

    if (userLikesResult?.data) {
      userLikesResult.data.forEach((row: PostLikeRow) =>
        likedSet.add(row.post_id)
      );
    }
  } catch (error) {
    console.log('Like metadata fetch error:', (error as Error).message);
  }

  return { counts, likedSet };
}

export async function likePost(postId: string, userId: string) {
  return supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
}

export async function unlikePost(postId: string, userId: string) {
  return supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);
}
