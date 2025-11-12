# 1) Auth Flow

**A1. Sign up**
1. Open app (logged out).
2. Sign up with a fresh email/password and a valid username (3–20 chars, letters/digits/underscore).
3. Expect: success -> auto redirect to Login.
4. Login with same credentials.
5. Expect: land on tab Feed.

**A2. Session persistence**
- Kill app, reopen.
- Expect: still logged in (session restored) and tabs visible.

**A3. Sign out**
- Profile → Sign out.
- Expect: return to Auth screens; calling signOut doesn’t throw; web console shows no auth errors.

**A4. Sign in (wrong password)**
- Try valid email with a wrong password.
- Expect: inline error shown; no navigation.

# 2) Profile Editing (display name + avatar)

**P1. Open edit from Profile
- On Profile tab, tap **Edit Profile** (button).
- Expect: edit screen opens; **tab bar still visible**

**P2. Change display name only**
- Set Display Name = “Test User One”.
- Save.
- Expect: back to Profile; name shows “Test User One” and in Feed, author header uses it.

**P3. Change avatar**
- In Edit Profile pick an image; Save.
- Expect: avatar shows on Profile; reload Feed — your posts show avatar in the header.

**P4. Persistence**
- Sign out -> sign in.
- Expect: display name + avatar persist.

# 3) Create Posts (text / image / both) + Auto-refresh

**Po1. Text-only**
- Create -> “Hello world”.
- Expect: new post at top without manual refresh.

**Po2. Image-only**
- Create -> pick image, leave text empty.
- Expect: post appears with image at top.

**Po3. Text + image**
- Create -> text + image.
- Expect: both render; timestamp sensible.

**Po4. Limits & errors**
- Try >500 chars.
- Expect: client-side validation message; nothing inserted.

**Po5. Post Image Enlargement**
- Click on images on posts
- Expect: image fills screen. Tap, Swipe or Click the X button to close modal

**Po6. Post Deletion**
- Delete Post
- Expect: post remove from feeds.

# 4) Feed Rendering (author box + order + empty)

**F1. Author header**
- For each card: avatar (or stub), display_name || username, `@username`, timestamp.
- Your own posts should use your new avatar/display_name.

**F2. Sorting**
- Newest first. Create another quick post; it should jump to top.

**F3. Empty state**
- If you have a fresh account with no posts: “No posts yet…” message shows.

# 5) Post Likes

**L1. Toggle like in Feed**
- Login as Account A, have Account B like/unlike a shared post.
- On Account A, tap the heart icon; expect instant counter changes followed by the persisted state after the Supabase mutation returns. Reload Feed to confirm the backend stored the latest value.

**L2. Likes in Profile lists**
- From Profile (self) tap the heart on one of your posts. Expect the counter and icon to update the same as in Feed.
- Switch to another user's profile and confirm their posts show accurate counts (no stale data between screens).

# 6) Notifications

**N1. Notification list**
- Have Account B like Account A's post (repeat with another person on the same post to test aggregation).
- Account A opens the Notifications tab: expect entries grouped per post with language such as “Alice and Bob liked your post” and a `[n] people liked your post` line, plus the post snippet and latest timestamp.

**N2. Tab badge**
- Before opening Notifications, trigger another like from Account B.
- The tab bar badge above the bell icon should be displayed. After opening the tab (once the list loads), the badge should clear automatically because the likes are now marked as read.

**N3. Unread-only feed**
- After viewing (and thus clearing) notifications, pull to refresh on the Notifications tab again.
- Expect: the list is empty (“You're all caught up…”) until a brand-new like arrives (created after the last read timestamp).

# 7) Unified Refresh & Likes Sync

**R1. Feed refresh button**
- With two devices/accounts, have Account B like one of Account A’s posts.
- On Account A, tap the `Refresh` button (or pull down) on Feed.
- Expect: like count toggles to the latest value without navigating away.

**R2. Profile refresh propagation**
- From Feed, tap `Refresh` and then switch to Profile.
- Expect: Profile list already reflects the updated counts (because the refresh token fan-out reloaded it in the background). Optionally tap the Profile `Refresh` button to confirm it retriggers the same fetch.

**R3. Notifications refresh**
- Have Account B like/unlike Account A’s post.
- On Account A’s Notifications tab, tap `Refresh`.
- Expect: newest like events appear/end up removed, and the pull-to-refresh gesture yields the same result (both go through the centralized refresh provider).
