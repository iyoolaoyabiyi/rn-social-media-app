### 1. Project Summary

Build a mobile social app called Framez using React Native (Expo) that allows authenticated users to create posts (text and/or image), view a global feed, and view their own profile and posts. Backend must use one of Firebase/Supabase/Convex/Clerk, with persistent auth and real-time or near real-time data. Target: Android + iOS, demo via Appetize link and GitHub repo.

### 2. Core User Roles

- Anonymous user:
    - Can see auth screens.
    - Cannot access feed, create posts, or view profiles.
- Authenticated user:
    - Can create posts.
    - Can view global feed.
    - Can view own profile and posts.
    - Can log out.

### 3. Functional Requirements

1. Authentication and User Profile
	- Sign up with:
	    - Email + password (for auth only)
	    - Username (unique, public identifier)
	    - Optional display name and avatar
	- Login with email + password.
	- Logout.
	- Persistent session on restart.
	- Username must be:
	    - Unique and immutable after creation (for now).
	    - 3–20 chars, letters/numbers/underscores.
	- Emails are **never displayed** to other users — only to the profile owner.
2. Posts
    - Create post with:
        - Text (required or optional; we’ll define exact rule in design).
        - Optional image upload.
    - Store posts in backend.
    - Global feed:
        - Show all posts (most recent first).
        - Each post displays: author name and username, timestamp, text, image (if present).
3. Profile
    - Show logged-in user info:
		- Username
		- Display name (optional)
		- Avatar (if present or derived).
		- Show all posts authored by the user.
		- Only the profile owner can see their email and account settings.
4. For authenticated users:
   Can update their own profile via an Edit Profile screen:
    - Editable:     
		- `display_name`         
		- `avatar` (upload/change)
    - Not editable (for now):
		- `username` (locked once chosen)    
		- `email` (managed separately via auth, outside v1 scope)
5. Email visibility: 
    - Only the logged-in user sees their email (in an Account box on Profile).     
    - Other users only ever see:     
        - `username`         
        - `display_name` (if set)         
        - `avatar`         
        - posts

### 4. Non-Functional Requirements

- Smooth navigation and responsive layout.
- Visually clean UI (Instagram-inspired but not a clone).
- Stable on Android and iOS via Expo.
- Auth and data flows must be robust and secure enough for this scope.
- Secure storage and fetching of user metadata (username, display name, avatar) separate from auth email.
- Email visibility restricted to authenticated owner via protected queries.
- Codebase:
    - Clear structure.    
    - Readable, consistent style.     
    - No runtime errors or red screens.    

### 5. Technical Constraints

- Framework: React Native with Expo.
- Backend: One pick: Firebase / Supabase / Convex / Clerk.
    - Default to Supabase (email/password + real-time + simple Postgres)   
- State management: React hooks and Context; we only add Zustand/Redux if needed.
- Image handling: Expo-friendly solution (device image picker, upload to backend/storage).
- Deployment: 
    - Test on Expo Go.     
    - Appetize.io link for submission.        

### 6. Deliverables

- Working Expo app (Framez).
- Public GitHub repo:
    - Clean commit history.
    - README with:
        - Setup instructions.
        - Backend choice and rationale.
        - Feature list and limitations.
- Hosted Appetize.io demo link.
- 2–3 minute demo video.

### 7. Acceptance Criteria

- Register, login, logout works.
- Session persists across app restarts.
- User can create posts.
- Posts appear correctly in global feed.
- Profile correctly shows user info + their posts.
- Smooth navigation; no major UI glitches.
- Runs on Android and iOS without errors.