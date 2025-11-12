### 1. Architecture Overview

- **Client:** React Native app built with Expo.
- **Backend:** Supabase (Postgres + Auth + Storage).
- **Auth:** Supabase email/password.
- **Identity in UI:** `username` (unique, public), email visible only to owner.
- **Data:** 
    - `profiles` table for public user info.     
    - `posts` table linked to `profiles`.     
- **Media:** 
    - Supabase Storage:     
        - `avatars` bucket.         
        - `post-images` bucket.         
- **Access:** 
    - RLS-secured endpoints.     
    - Public readable profiles + posts.     
    - Write operations only for authenticated users.
- **Refresh orchestration:** A `RefreshProvider` context emits scope tokens (`posts`, `notifications`) so that pull-to-refresh or tap-to-refresh actions in any screen fan out to the rest (e.g. when Feed refreshes, profile and notifications re-run their queries and get the new like counts).

### 2. Navigation Flow

Root decides based on auth state:
1. **Unauthenticated**      
    - Login        
    - Register (with username)        
2. **Authenticated (Main App)**    
    - Bottom Tabs:       
        - **Feed** – Global posts list.            
        - **Create** – Create post (text + optional image).            
        - **Profile** – User profile (shows:            
            - username, display name, avatar                
            - posts by that user                
            - email visible only to owner in a small “Account” section)
Wired with Expo Router

### 3. Data Model

`profiles.id` to `auth.users.id` will be tied. Emails live only in `auth.users`; `profiles` is the public-facing layer.

#### `profiles`

- `id` (uuid, PK) – references `auth.users.id`
- `username` (text, unique, required)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)
**Rules**:
- One profile per user.
- `username` is the public handle.
- Email never stored here.

#### `posts`

- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, FK → `profiles.id`, required)
- `content` (text, required)
- `image_url` (text, nullable)
- `created_at` (timestamptz, default `now()`)
**Rules**:
- All posts are globally visible.
- Ownership determined by `user_id`.

### 4. Security & RLS

Enable RLS and apply minimal, clear policies.
Profile creation will be handled at signup so the invariant `profiles.id = auth.uid()` always holds.

### 5. Engagement Features

- **Likes:** `post_likes` table stores user → post relations. Post cards hydrate like counts and whether the viewer liked each entry so interactions feel instant.
- **Notifications + Badge:** `notifications.tsx` lists only unread likes (filtered by `lastReadAt`), groups multiple likes on the same post into summaries (“A and B liked your post … [n] people liked…”), and once viewed it calls `markAsRead` so the badge (driven by `NotificationContext`) clears until new likes arrive.
- **Visual System:** `src/theme` defines shared palette/spacing/typography tokens consumed by `Typography`, `Avatar`, `SkeletonCard`, and updated cards. Expo Haptics + Reanimated power micro interactions (likes/deletes + card entrances) for polish.


### 6. Project Structure (Expo + TS)

Planned structure:
```
Framez/
  App.tsx
  src/
    lib/
      supabase.ts
    navigation/
      AppNavigator.tsx   
      AuthNavigator.tsx  
      RootNavigator.tsx  
    screens/
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
      feed/
        FeedScreen.tsx
      posts/
        CreatePostScreen.tsx
      profile/
        ProfileScreen.tsx
    components/
      PostCard.tsx
      Avatar.tsx
      TextInput.tsx
      Button.tsx
    hooks/
      useAuth.ts
    types/
      index.ts
```

### Fallback Structure

```
Framez/
  app/
	  (tabs)/
		  profile/
			  [username]
			  edit
			  index.tsx
		  _layout.tsx
		  create.tsx
		  feed.tsx
		_layout.tsx
		index.tsx
		login.tsx
		register.tsx
	src/
    lib/
      supabase.ts
    components/
	    AppContainer.tsx
      PostCard.tsx
      ProfileView.tsx
    types/
      index.ts
```
