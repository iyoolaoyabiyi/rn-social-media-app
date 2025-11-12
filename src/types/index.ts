export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Post = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  likes_count: number;
  liked_by_me: boolean;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};
