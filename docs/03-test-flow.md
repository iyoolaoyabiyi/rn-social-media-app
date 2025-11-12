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

**C1. Text-only**
- Create -> “Hello world”.
- Expect: new post at top without manual refresh.

**C2. Image-only**
- Create -> pick image, leave text empty.
- Expect: post appears with image at top.

**C3. Text + image**
- Create -> text + image.
- Expect: both render; timestamp sensible.

**C4. Limits & errors**
- Try >500 chars.
- Expect: client-side validation message; nothing inserted.

**C4. Limits & errors**
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