# Framez (Expo + Supabase)

Framez is a cross-platform social posting app built with Expo Router and Supabase. Authenticated users can publish mixed media posts, browse a global feed, and manage a private profile.

## Documentation Map
- [Requirement Specification](docs/01-requirement-specifications.md) – product scope, acceptance criteria, non-functional constraints.
- [Systems Design](docs/02-systems-design.md) – architecture, navigation, data model, and security assumptions.
- [Test Flow](docs/03-test-flow.md) – manual QA scenarios covering auth, posting, profile edits, and feed behavior.

## Feature Highlights
- Supabase email/password auth with persistent sessions (`src/context/AuthContext.tsx`).
- Username-first identity model: usernames are public, immutable handles, while emails remain private to the owner.
- Global feed pulling real-time friendly data from `posts` with author joins (`app/(tabs)/feed.tsx` + `src/components/PostCard.tsx`).
- Rich post composer with client-side validation, optional image upload to Supabase Storage, and optimistic navigation (`app/(tabs)/create.tsx`).
- Profile suite:
  - Self profile with private email drawer, edit + logout actions, and user-scoped feed (`app/(tabs)/profile/index.tsx`).
  - Edit profile flow with avatar upload/delete and display-name updates that refresh the auth context (`app/(tabs)/profile/edit.tsx`).
  - Public profile route for viewing any username (`app/(tabs)/profile/[username].tsx`).
- Responsive Expo Router tabs gated behind auth, using `AppContainer` to normalize spacing across devices.

## Architecture
```
Expo Router (app/*)
   ├─ Auth stack: /login, /register
   └─ Tabs stack: /(tabs)/{feed,create,profile}

src/
   ├─ context/AuthContext.tsx      # Session, profile cache, auth helpers
   ├─ lib/supabase.ts             # Supabase client + native session wiring
   ├─ components/{AppContainer,PostCard,ProfileView}
   └─ types/index.ts              # Shared Post + Profile contracts

Backend: Supabase (Postgres + Auth + Storage)
   ├─ Tables: profiles, posts
   ├─ Buckets: avatars, post-images
   └─ RLS: public read, owner-only mutations
```

Refer to [docs/02-systems-design.md](docs/02-systems-design.md) for the full navigation tree and data-model diagram.

## Local Development
### Prerequisites
- Node.js 18+
- `pnpm` 9+ (preferred) or `npm`
- Expo CLI (`npx expo` is enough if you do not want a global install)
- A Supabase project with the schema described below

### Install & Run
```bash
# 1. Install deps
pnpm install

# 2. Provide environment values (see next section)
cp .env.example .env    # create one if it does not exist

# 3. Start Metro bundler
pnpm expo start         # or: npx expo start
```

Use the QR code or platform shortcuts shown in the CLI to open the app in Expo Go, iOS Simulator, or Android Emulator.

### Environment Variables
The Expo app expects the following public env keys (add them to `.env` or `app.config.*` and reload Metro):

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xyz.supabase.co`). |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase anon/public API key with RLS enabled. |

These are consumed in `src/lib/supabase.ts`. Missing values will throw during bundle time.

## Supabase Setup
Follow [docs/02-systems-design.md](docs/02-systems-design.md#data-model) for conceptual details. The essentials are summarized below.

### Tables
```sql
-- Public profile data
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz default now()
);
```

### Storage Buckets
- `avatars` – user avatars uploaded from `/profile/edit`.
- `post-images` – optional media uploaded from the create screen.

Both buckets should expose public read access but restrict writes to authenticated users (or, ideally, edge function uploads). See Supabase dashboard -> Storage -> Policies.

### Row-Level Security
Enable RLS on `profiles` and `posts` and add policies such as:
1. **Profiles**
   - `auth.uid() = id` can insert/update its own row.
   - `true` can select all rows (public data only).
2. **Posts**
   - `auth.uid() = user_id` can insert/delete/update.
   - `true` can select to fuel the global feed.

### Triggers
- Create an `auth.users` trigger to auto-insert a profile row on sign-up if you’d rather not rely on `signUp` metadata.

## Testing & QA
Manual happy-path and regression coverage lives in [docs/03-test-flow.md](docs/03-test-flow.md). The checklist spans:
- **Auth** – sign-up, login, session persistence, wrong-password errors, logout routing.
- **Profile edits** – edit modal, avatar upload/delete flows, private email visibility.
- **Posting** – text-only, image-only, mixed media, 500-character validation, owner delete.
- **Feed** – ordering, rendered author metadata, empty state messaging.

Automated tests are not yet wired; the Test Flow serves as the acceptance suite for staging/demo builds.

## Deployment
- Local builds: `pnpm expo run:ios` / `pnpm expo run:android`.
- Cloud builds via EAS: configure the `preview`/`production` profiles defined in `eas.json`, ensuring the Supabase env vars are present in each profile’s secrets.

---
Need product context, system assumptions, or QA scripts? Start with the documents in `/docs`, I'll try to keep them up to date alongside the codebase.
