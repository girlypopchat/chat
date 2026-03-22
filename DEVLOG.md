# GirlyPopChat - Developer Log

## Infrastructure Overview

**Architecture Overview:**
Three separate Next.js apps managed by docklite (lightweight docker orchestrator), with nginx as the reverse proxy.

### **What is Docklite?**

Docklite is a lightweight docker container manager that:
- Manages all three Next.js apps as containers
- Handles automatic restarts on container failure
- Volume mounts code directories for hot-reloading
- Maps container ports to host ports
- Simplifies deployment without full Docker Compose or Kubernetes

### **Container & Port Configuration**

| App | Path | Container | Internal Port | Public Port | Domain |
|-----|------|-----------|---------------|-------------|--------|
| Landing page | `/var/www/sites/stella/girlypopchat.com/` | `docklite-site-girlypopchat-com` | 3000 | 32802 | girlypopchat.com |
| Chat app | `/var/www/sites/stella/secret.girlypopchat.com/` | `docklite-site-secret-girlypopchat-com` | 3012 | 3099 | secret.girlypopchat.com |
| Admin console | `/var/www/sites/stella/console.girlypopchat.com/` | `docklite-site-console-girlypopchat-com` | 3000 | 32854 | console.girlypopchat.com |

### **Nginx Reverse Proxy**

**Location:** `/var/www/sites/stella/` (host server)

**Configuration:** Nginx reverse-proxies all three domains to their respective container ports:
- girlypopchat.com → container 32802 (landing page)
- secret.girlypopchat.com → container 3099 (chat app with Socket.IO)
- console.girlypopchat.com → container 32854 (admin console)

**SSL Certificates:** Let's Encrypt covers all subdomains with a single certificate.

### **How It Works**

```
User → girlypopchat.com
  ↓
Nginx (port 443/80)
  ↓
docklite-site-girlypopchat-com:3000
  ↓
Next.js Landing Page
```

### **Shared Resources**

**Secret App Directory:** The `secret/` directory in the landing page repo is a symlink to `/var/www/sites/stella/secret.girlypopchat.com/`

**Shared Database:** Both secret and console apps access the same SQLite database at `/var/www/sites/stella/secret.girlypopchat.com/prisma/dev.db`

**Shared Session Cookie:** Session cookie set on `.girlypopchat.com` domain allows users to stay logged in across:
- secret.girlypopchat.com (main app + admin panel)
- console.girlypopchat.com (console domain)

### **Socket.IO + Custom Server**

The chat app runs a **custom Next.js server** (`secret/server.ts`) that:
1. Starts Next.js HTTP server on port 3012
2. Attaches Socket.IO to the **same** HTTP server
3. Socket.IO server imported from `secret/mini-services/chat-server/index.ts`

**Benefit:** Only port 3012 needs to be exposed - HTTP and WebSocket traffic share the same connection.

---

## App Management Commands

### **Rebuild & Deploy Apps**

```bash
# Landing page (girlypopchat.com)
docker exec docklite-site-girlypopchat-com npx next build
docker restart docklite-site-girlypopchat-com

# Chat app (secret.girlypopchat.com)
docker exec docklite-site-secret-girlypopchat-com npx next build
docker restart docklite-site-secret-girlypopchat-com

# Admin console (console.girlypopchat.com)
docker exec docklite-site-console-girlypopchat-com npx prisma@6 generate
docker exec docklite-site-console-girlypopchat-com npm run build
docker restart docklite-site-console-girlypopchat-com
```

### **Database Changes (secret app):**
```bash
docker exec docklite-site-secret-girlypopchat-com npx prisma db push
```

### **Generate Admin Invite Codes:**
```bash
docker exec docklite-site-secret-girlypopchat-com npx tsx -e "
import { db } from './src/lib/db';
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
for (let i = 0; i < 10; i++) {
  let code = '';
  for (let j = 0; j < 8; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  await db.inviteCode.create({ data: { code, maxUses: 1, expiresAt } });
  console.log(code);
}
"
```

### **View App Logs:**
```bash
# Landing page
docker logs docklite-site-girlypopchat-com --tail 50

# Chat app
docker logs docklite-site-secret-girlypopchat-com --tail 50

# Admin console
docker logs docklite-site-console-girlypopchat-com --tail 50
```

### **Restart Containers:**
```bash
docker restart docklite-site-girlypopchat-com
docker restart docklite-site-secret-girlypopchat-com
docker restart docklite-site-console-girlypopchat-com
```

### **How to Update Code**

1. Make changes to files in `/var/www/sites/stella/[app-name].com/`
2. Changes are immediately available to the container (volume mount)
3. Rebuild: `docker exec docklite-site-[app-name]-girlypopchat-com npx next build`
4. Restart: `docker restart docklite-site-[app-name]-girlypopchat-com`

**No need to:**
- Copy files into container (they're volume mounted)
- Stop/restart for code changes (only for rebuilds)
- Rebuild container (just restart after build)

**Only rebuild when:**
- Dependencies added/removed in package.json
- Next.js configuration changed
- TypeScript compilation errors
- Production build needed

The chat app runs a **custom Next.js server** (`secret/server.ts`) that:
1. Starts Next.js HTTP server on port 3012
2. Attaches Socket.IO to the **same** HTTP server
3. Socket.IO server imported from `secret/mini-services/chat-server/index.ts`

**Benefit:** Only port 3012 needs to be exposed - HTTP and WebSocket traffic share the same connection.

### **Key Commands**

Three separate Next.js apps managed by docklite (a lightweight docker orchestrator):

| App | Path | Container | Port |
|-----|------|-----------|------|
| Landing page | `/var/www/sites/stella/girlypopchat.com/` | `docklite-site-girlypopchat-com` | 32802 |
| Chat app | `/var/www/sites/stella/secret.girlypopchat.com/` | `docklite-site-secret-girlypopchat-com` | 3099 (mapped from internal 3012) |
| Admin console | `/var/www/sites/stella/console.girlypopchat.com/` | `docklite-site-console-girlypopchat-com` | 32854 |

Nginx reverse-proxies all three from the public internet. SSL cert covers all subdomains via Let's Encrypt.

The chat app runs a **custom Next.js server** (`server.ts`) that attaches Socket.IO to the same HTTP server on port 3012, so only one port needs to be exposed. The socket server lives at `mini-services/chat-server/index.ts` and is imported by `server.ts`.

The `secret/` directory in the landing page repo is a symlink to `/var/www/sites/stella/secret.girlypopchat.com/`.

### Key commands
```bash
# Rebuild and restart the chat app
docker exec docklite-site-secret-girlypopchat-com npx next build
docker restart docklite-site-secret-girlypopchat-com

# Push schema changes
docker exec docklite-site-secret-girlypopchat-com npx prisma db push

# Rebuild the console
docker exec docklite-site-console-girlypopchat-com npm run build
docker restart docklite-site-console-girlypopchat-com
```

---

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **Database**: SQLite via Prisma (two databases: chat + waitlist)
- **Auth**: Stytch (OAuth: Google/Discord/Apple + email magic links)
- **Realtime**: Socket.IO attached to the Next.js HTTP server
- **Video**: LiveKit (broadcaster token + viewer token system)
- **Storage**: SQLite for messages/users, Imgur API for image uploads
- **Styling**: Tailwind CSS

---

## What We Built — Complete History

---

### Phase 1: Initial Setup & Bug Fixes

The repo came with a `gpc-final-complete.tar.gz` containing updates that were extracted into `secret/`. Several bugs were introduced:

- `auth.ts` imported `@stytch/nextjs` (browser SDK) instead of `stytch` (server SDK) — fixed to use `Client` from `stytch`
- `startOAuth` referenced an undefined `type` variable — fixed OAuth provider casting
- `package.json` start script used `concurrently` splitting Next.js and Socket.IO — fixed to `tsx server.ts` which does both on one port
- LiveKit token functions were changed from async to sync — reverted back to async (required by SDK v2)
- Auth callback redirected to `localhost:3012` instead of the real domain — fixed to use `NEXT_PUBLIC_APP_URL`

---

### Phase 2: Auth Flow

**Files:**
- `src/app/login/page.tsx`
- `src/app/api/auth/oauth/[provider]/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/app/api/auth/magic-link/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/socket-token/route.ts`

**What it does:**

The login page offers email magic link + Google/Discord/Apple OAuth. Both paths route through `/api/auth/callback`. The callback detects the `stytch_token_type` query param to call either `stytch.magicLinks.authenticate()` or `stytch.oauth.authenticate()`. 

After authenticating, `getOrCreateUser()` runs — but **registration is currently locked** (`REGISTRATION_OPEN = false` in `src/lib/auth.ts`). Existing users proceed; new users get redirected to `/login?error=closed`.

The session cookie is set on `.girlypopchat.com` (with leading dot) so it's shared across all subdomains including `console.girlypopchat.com`.

A separate `/api/auth/socket-token` endpoint exists because the main `session_token` cookie is `httpOnly` (JS can't read it), so the Socket.IO client fetches it from this endpoint on connect.

**Flow for new users (when registration is open):**
```
/login → OAuth/magic link → /api/auth/callback → /verify (age) → /setup (identity) → /chat
```

**Flow for returning users:**
```
/login → OAuth/magic link → /api/auth/callback → /chat
```

---

### Phase 3: Age Verification

**Files:**
- `src/app/verify/page.tsx`
- `src/app/api/age/route.ts`

Simple DOB self-declaration form. User enters date of birth, client calculates age, if 18+ it POSTs to `/api/age` which sets `ageVerified = true` on the user record. The note in the codebase flags this as a placeholder — real verification (A3's free tier, 50k checks/month, passive behavioral estimation) is planned for April launch.

After verify, redirects to `/setup`.

---

### Phase 4: Identity System

**Files:**
- `src/app/setup/page.tsx`
- `src/app/api/setup/route.ts`
- `src/lib/last-names.ts`

**Schema additions to User:**
```prisma
firstName       String?
lastName        String?
lastNameEmoji   String?
genderIcon      String?   // 🌸 Feminine, 🌿 Nonbinary, 🚹 Masculine
identitySetup   Boolean   @default(false)
displayMode     String    @default("full")
```

**Last names:** ~110 curated words across 7 categories (Nature, Celestial, Sweet, Magical, Elements, Creatures, Aesthetic), each with a matching emoji. Source: `src/lib/last-names.ts`.

**Display modes:**
- `full` → "Luna Starlight ✨"
- `first_only` → "Luna"
- `first_emoji` → "Luna ✨"
- `first_last` → "Luna Starlight"

Gender icon is optional and purely self-selected — no enforcement. The setup page shows a live preview of the display name as you build it.

`identitySetup` is checked on every page load in `/chat` — if false, redirects to `/setup`.

---

### Phase 5: Circle System

**Files:**
- `src/lib/circles.ts`
- `src/app/api/circles/route.ts`
- `src/app/api/circles/follow/route.ts`
- `src/app/api/circles/bestie/route.ts`
- `src/app/api/circles/tier/route.ts`
- `src/components/user-profile-card.tsx`

**Schema addition:**
```prisma
model Follow {
  followerId  String
  followingId String
  isBestie    Boolean @default(false)
  @@unique([followerId, followingId])
}
```

**Tiers are derived from follow relationships:**

| Tier | Condition | Emoji |
|------|-----------|-------|
| Fan | They follow you, you don't follow back | 👋 |
| Fave | You follow them, they don't follow back | ⭐ |
| Moot | Mutual follow | 🌸 |
| Bestie | Mutual follow + both have `isBestie = true` | 💖 |

`getCircleTier(myId, theirId)` does two DB lookups in parallel and returns the derived tier.

**UI:** Clicking any username (in sidebar or in chat messages) opens a `UserProfileCard` popover showing their name, tier badge, follow/unfollow button, bestie toggle (moots only), and a "Send Message" DM button.

---

### Phase 6: User Settings

**Files:**
- `src/app/settings/page.tsx`
- `src/app/api/settings/route.ts`

Three-tab settings page accessible via the gear icon in the chat header:

**Identity tab:** Edit first name, last name (same curated picker as setup), gender icon, display mode, bio (200 chars). Live preview. `PATCH /api/settings` rebuilds `displayName` from the updated fields.

**Privacy tab:**
- Camera privacy mode: Open (circle can see), Private (ask first), Invisible (invite only)
- DM permissions: Anyone / Moots / Besties / Nobody
- Online status toggle

**Camera tab:** Reference card showing broadcast indicator colors, panic button explanation, viewing rules summary.

**Schema additions to User:**
```prisma
privacyMode     String   @default("open")
allowDmsFrom    String   @default("moots")
showOnlineStatus Boolean @default(true)
cameraWhitelist String?  // JSON array of user IDs
cameraBlacklist String?  // JSON array of user IDs
```

---

### Phase 7: Privacy & Camera UI

In the chat interface:

**Broadcast indicators in user sidebar:**
- 🔴 Pulsing red dot — LIVE (broadcasting)
- 🟡 Yellow dot — READY (cam on, no broadcast)
- ⚪ Gray dot — PRESENT (in room, no cam)

Determined by checking `activeBroadcasters` array (populated from socket events) against the user list.

**Panic button:** Eye icon appears in header while you're broadcasting. Click to reveal "Who's Watching" bar showing viewer count. Close with X.

**Settings gear:** `<Settings />` icon in header links to `/settings`.

---

### Phase 8: DM System

**Files:**
- `src/lib/dm.ts`
- `src/app/api/dm/conversations/route.ts`
- `src/app/api/dm/messages/route.ts`
- `src/components/dm-panel.tsx`
- Socket.IO handlers added to `mini-services/chat-server/index.ts`

**Schema additions:**
```prisma
model DirectConversation {
  userAId   String
  userBId   String
  // always stored with lo < hi to guarantee uniqueness
  @@unique([userAId, userBId])
}

model DirectMessage {
  conversationId String
  senderId       String
  content        String
  imageUrl       String?
  isRead         Boolean @default(false)
}
```

**Permission check (`canDm`):** Reads the recipient's `allowDmsFrom` setting, then calls `getCircleTier` to verify the sender is in the right circle tier.

**API routes:**
- `GET /api/dm/conversations` — list all conversations with last message + unread count
- `POST /api/dm/conversations` — open/create a conversation (permission-checked)
- `GET /api/dm/messages?conversationId=x` — fetch messages (marks as read)
- `POST /api/dm/messages` — send a message (permission-checked again)

**Socket.IO events (real-time):**
- On connect: socket joins `dm:{userId}` personal room
- `dm:send` — creates message in DB, emits `dm:message` to both users' personal rooms
- `dm:typing` — forwards typing indicator to the other user
- `dm:read` — marks messages read, notifies other user

**UI:** "DMs" tab added to sidebar. Shows conversation list with unread badges. Click to open a conversation — messages render in chat-bubble style (your messages right-aligned pink, theirs left-aligned gray). Typing indicator. Scrolls to bottom on new messages. From the UserProfileCard "Send Message" button — creates/opens the conversation and switches to the DMs tab.

---

### Phase 9: Room System Enhancements (In Progress)

Schema and API done, build interrupted. Need to rebuild.

**Schema additions to Room:**
```prisma
roomType      String    @default("text")
accessMode    String    @default("public")  // public, password, secret
vibePreset    String    @default("cozy")    // cozy, party, focus, sleepover
guardians     String?   // JSON array of user IDs (the 5 creators)
```

**Room types:**
| Type | Emoji | Description |
|------|-------|-------------|
| text | 💬 | Classic chat |
| video | 📹 | Video fullscreen, chat in drawer |
| music | 🎵 | YouTube queue + voting |
| cinema | 🎬 | Screen share, legal content only |
| event | 🎪 | Petition system with co-signers |
| rave | 🪩 | All video, no chat |
| library | 📚 | All text, structured, quiet |

**Access modes:** Public (anyone), Password (requires key), Secret (invite-only, hidden from list)

**Vibe presets:** Cozy 🧸, Party 🎉, Focus 🎯, Sleepover 🌙 — will eventually affect the UI color/layout of the room.

**Guardians:** When a room proposal reaches 5 sponsors, all 5 become guardians (stored as JSON array of user IDs). Guardians have moderation powers within their room. Each user can be guardian of max 2 rooms total.

**Room proposal modal** updated with type/access/vibe pickers. Room list in sidebar shows type emoji badge and access mode icons.

**Still needed:** Rebuild after interruption, guardian permission checks in socket handlers, password-protected room join flow.

---

## Console App Status

**✅ console.girlypopchat.com** is LIVE and showing proper dashboard!

**Console Architecture:**
- **console.girlypopchat.com** - Landing page with quick links to all platforms
  - 🌐 girlypopchat.com - Main site with waitlist
  - ⚙️ secret.girlypopchat.com/admin - Full admin dashboard (invite codes, stats, etc.)
  - 💬 secret.girlypopchat.com - Beta app
  - ⭐ console.girlypopchat.com - This page itself

**Quick Links on console.girlypopchat.com:**
- Go to Main Site
- Go to Admin Panel
- Go to Beta App
- Full platform links footer

**Secret Admin Dashboard Features (/admin):**
- 📊 Overview stats (Users, Active, Rooms, Messages)
- 🎫 Invite codes management
  - Generate bulk codes (1-50 at once)
  - Send email invites with custom messages
  - View all codes with status (Available/Used/Expired)
  - Configurable max uses & expiration
  - Copy/delete codes
- 👥 User management (coming)
- 🏠 Room management (coming)
- 💬 Message logs (coming)

## What's Next

### Display Modes & Themes

Implement a theme system stored in `localStorage` (and later DB for roaming):

**Color modes:**
- 🌈 Rainbow — rotating pastel gradients cycling through pink → yellow → baby blue → lavender → mint
- 🌸 Light — static pastel pink/yellow/blue/white palette
- 🖤 Dark — sleek muted dark mode
- 🪖 Camo — masculine-coded UI with subtly condescending copy (e.g., "Nice one, champ", "Loading your guy stuff...", "Room joined. Bro approved.") — so patronizing it might go over their heads

**Patronization UI (all themes):** Subtle condescending flavor text throughout:
- 404: "Page playing hide and seek. So clever."
- Loading: "You're doing so well waiting."
- Empty state: "Wow, nothing here. You found it!"
- Success toasts: "You did it, sweetie!"
- Settings saved: "Great job figuring out settings!"

---

## Architecture Documentation

### **Domain Structure**

| Domain | Purpose | Tech Stack |
|---------|---------|------------|
| girlypopchat.com | Public landing page | Next.js + Waitlist DB |
| secret.girlypopchat.com | Beta chat app | Next.js + Socket.IO + Stytch Auth |
| secret.girlypopchat.com/admin | Admin dashboard | Next.js + Full management |
| console.girlypopchat.com | Quick links landing | Next.js (redirects) |

### **Data Flow**

**User Session Flow:**
1. User logs in via OAuth or magic link at secret.girlypopchat.com/login
2. Stytch callback sets session cookie on `.girlypopchat.com`
3. Session cookie shared across:
   - secret.girlypopchat.com (main app + admin)
   - console.girlypopchat.com (console domain)
4. Users can access admin panel from console domain without re-login

**Invite Code Flow:**
1. Admin generates codes at `/admin/invites`
2. Codes stored in shared SQLite database
3. User enters code at `/login?invite=CODE`
4. New user created, code marked as used
5. Welcome email sent via Resend

### **Why This Architecture?**

**Three separate apps:**
- **Isolation**: Landing page waitlist DB is separate from chat DB
- **Simplicity**: Each app has focused responsibility
- **Deployability**: Can update/rebuild apps independently
- **Admin access**: Admin functions in secret app, separate from public landing

**Nginx as gateway:**
- **SSL termination**: Single Let's Encrypt cert for all subdomains
- **Load balancing**: Can add multiple containers behind nginx
- **Static file serving**: Efficient for public assets
- **Routing**: Domain-based routing to correct app

**Docklite for container management:**
- **Auto-restart**: Containers restart on crash/failure
- **Volume mounts**: Code changes sync without rebuild
- **Port mapping**: Internal container ports → public host ports
- **Lightweight**: No Docker Compose or Kubernetes complexity
- **Simple deployment**: Just `docker restart` after rebuilds

### **Infrastructure Diagram**

```
Internet (Port 443/80)
  ↓
Nginx (SSL termination)
  ├─→ girlypopchat.com:32802 (Landing page)
  ├─→ secret.girlypopchat.com:3099 (Chat app)
  └─→ console.girlypopchat.com:32854 (Admin console)
       ↓
       Secret App
       ├─→ / (Public chat app)
       ├─→ /admin (Admin panel with invite codes)
       └─→ /api (API endpoints)
```

**Storage:**
- `/var/www/sites/stella/[domain].com/` - App source code
- SQLite databases in respective app directories
- Shared session cookie across subdomains
- Volume mounts for hot code reloading

---

## What's Next

When user types `@` in the chat input:
- Show autocomplete dropdown of users currently in the room
- Filter as they continue typing
- Tab or click to complete
- Mentioned username gets highlighted in the sent message
- The mentioned user gets a special socket notification/highlight

Implementation: debounced filtering of the `users` state array, positioned dropdown above the input, keyboard navigation (up/down/tab/escape).

### Events System (April)

Petition flow: User proposes event → needs X co-signers → event confirmed → notifications sent.

Event types with minimum co-signers:
- Movie night (15), Karaoke (10), Panel (20), Game night (8), Workshop (12), Listening party (10), Tournament (25)

### Currency System (April)

Two firewalled currencies:
- **Strawberries 🍓** — cosmetic, earnable passively (+1/30 sec), spendable on badges/themes/gifts. No cash out.
- **Diamonds 💎** — creator economy, buyable/giftable to creators only, cash out via Stripe. No cosmetics.

The firewall is architectural — separate tables, separate APIs, the purchase/spend flows never touch each other.

### Supershadowban (April)

A moderation tool where the user is *told* they've been shadowbanned but can still post/buy. Nobody else sees their messages. They continue funding the platform invisibly. Implemented as a `isShadowbanned` flag on User that the socket server checks before broadcasting messages to the room.

### Real Age Verification (April)

Replace the DOB self-declaration with A3's free open-source tier (50k checks/month, passive behavioral estimation, no PII stored). Already have the license drafted. Backup options: Redact-ID, PrivateAV.

### Admin Invite Codes Management

**Implemented:** Full invite codes management interface for admins and moderators.

**Location:** https://secret.girlypopchat.com/admin/invites

**Features:**
- View all invite codes with status (Available, Used, Expired)
- Generate bulk invite codes (1-50 at a time)
- Configurable max uses per code
- Configurable expiration (days)
- Send direct email invites with custom messages
- Copy codes to clipboard with one click
- Delete unused codes
- Real-time stats (Total, Available, Used)

**API Endpoints (Admin/Moderator only):**
- `GET /api/admin/invites` - List all invite codes
- `GET /api/admin/invites/stats` - Get invite code statistics
- `POST /api/admin/invites/generate` - Generate new codes (count, maxUses, expiresInDays)
- `POST /api/admin/invites/send` - Send invite email (email, message)
- `DELETE /api/admin/invites/[id]` - Delete an invite code

**Security:**
- Only users with `role = 'admin'` or `role = 'moderator'` can access
- Session validation on every request
- Cannot delete used codes (prevents breaking existing accounts)

**Email Template:**
- Beautiful gradient design matching GirlyPopChat branding
- Includes inviter's name
- Custom message support
- Large, easy-to-read invite code display
- One-click sign-up link with code pre-filled

**Generate invite codes via UI:**
1. Go to https://secret.girlypopchat.com/admin/invites
2. Click "Generate Codes"
3. Set count (1-50), max uses per code, expiration days
4. Click "Generate"
5. Codes appear in the list below

**Send email invite:**
1. Go to https://secret.girlypopchat.com/admin/invites
2. Click "Send Email Invite"
3. Enter recipient email
4. Add optional personal message
5. Click "Send Invite"
6. A unique code is generated and emailed automatically

**Generate invite codes via CLI:**
```bash
docker exec docklite-site-secret-girlypopchat-com npx tsx -e "
import { db } from './src/lib/db';
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
for (let i = 0; i < 10; i++) {
  let code = '';
  for (let j = 0; j < 8; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  await db.inviteCode.create({ data: { code, maxUses: 1, expiresAt } });
  console.log(code);
}
"
```

---

### Invite Code System Fix

**Issue:** Original logic checked `REGISTRATION_OPEN` BEFORE invite code validation, so new users with valid invite codes were being rejected.

**Fix Applied:** Restructured `getOrCreateUser()` in `secret/src/lib/auth.ts`:

**New Logic Flow:**
```
1. User exists → Login (invite code ignored for returning users)
2. User doesn't exist → Check invite code:
   a. Valid invite → Allow signup
   b. Invalid/expired invite → Throw INVALID_INVITE error
   c. No invite code & REGISTRATION_OPEN = false → Throw REGISTRATION_CLOSED
```

**Benefits:**
- Existing users can always log in (with or without invite code)
- New users with valid invite codes can sign up
- New users without invite codes get clear error message
- Invalid/expired codes are properly rejected
- Invite codes are marked as used after signup

**Error Messages:**
- `INVALID_INVITE` - Code not found, already used, or expired
- `REGISTRATION_CLOSED` - No invite code provided and registration is closed

**Deployment:**
```bash
docker exec docklite-site-secret-girlypopchat-com npm run build
docker restart docklite-site-secret-girlypopchat-com
```

### Invite-Only Signup (Beta Implementation)

**Implemented:** Registration is now invite-only for beta testers.

**Files:**
- `secret/src/app/login/page.tsx` - Added invite code input field
- `secret/src/app/api/auth/magic-link/route.ts` - Sets invite_code cookie, clean callback URL
- `secret/src/app/api/auth/oauth/[provider]/route.ts` - Sets invite_code cookie, clean callback URL
- `secret/src/app/api/auth/callback/route.ts` - Reads invite code from cookie (or query param fallback), deletes after use
- `secret/src/lib/auth.ts` - `getOrCreateUser()` validates invite code, returns {user, isNew, email}
- `secret/src/app/api/admin/invite-codes/route.ts` - Admin endpoint to generate invite codes

**How it works:**
1. Admin generates invite codes via `POST /api/admin/invite-codes` (count, maxUses, expiresInDays, trustBonus)
2. Login page shows "Invite code (optional for returning users)" field
3. When user submits login, invite code is stored in httpOnly cookie
4. User goes through OAuth/magic link flow to Stytch (clean callback URL matching dashboard)
5. On callback, invite code is read from cookie, validated, then deleted
6. New users must provide valid invite code to create account
7. Returning users can sign in without invite code (matched by email)
8. Stytch account linking enabled - same email = same account across providers
9. Welcome email sent automatically to new users (if email preferences allow)

**Stytch Callback URL Fix:**
- Old approach: Passed invite code as query param (`?invite=CODE`) - rejected by Stytch
- New approach: Store invite code in httpOnly cookie (persists across OAuth round-trip)
- Benefits: Clean callback URL, no dashboard configuration needed, secure (httpOnly), backward compatible

**Current beta invite codes:**
- LKHU5XC6, V6RV7EWE, GSSBYYDS, GNKJ3UCK, 56WG6BT4, KWKD7BLE, 5DNHAK95, TY985QMH, V4ZJHDVL, TL9BMGYT

**Generate more codes:**
```bash
docker exec docklite-site-secret-girlypopchat-com npx tsx -e "
import { db } from './src/lib/db';
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
for (let i = 0; i < 10; i++) {
  let code = '';
  for (let j = 0; j < 8; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  await db.inviteCode.create({ data: { code, maxUses: 1, expiresAt } });
  console.log(code);
}
"
```

---

### Email System (Beta Implementation)

**Implemented:** Full email system with Resend for transactional, marketing, and onboarding emails.

**Files:**
- `secret/src/lib/email.ts` - Email service module with sendEmail(), sendWelcomeEmail(), sendNotificationEmail(), sendInviteEmail()
- `secret/src/app/api/email/preferences/route.ts` - API to get/update email preferences
- `secret/src/app/api/email/unsubscribe/route.ts` - Unsubscribe endpoint with confirmation page
- `secret/prisma/schema.prisma` - Added EmailLog and EmailPreference models

**Features:**
- Welcome emails on signup (if user preferences allow)
- Notification emails (DMs, follows, mentions - to be wired to socket events)
- Invite emails with invite codes (ready for admin invite sending)
- Email preferences per user (welcome, notifications, newsletters, marketing, system)
- Global email toggle (enable/disable all)
- One-click unsubscribe from email footer
- Email delivery tracking (status, message ID, errors, metadata)

**Database additions:**
```prisma
model EmailLog {
  id, userId, type, subject, toEmail, status, messageId, error, metadata, createdAt, sentAt
}

model EmailPreference {
  id, userId, welcome, notifications, newsletters, marketing, system, enabled
}
```

**Email templates:**
- WelcomeEmail - Gradient design, quick start guide, call-to-action
- NotificationEmail - Generic template for DMs, follows, mentions
- InviteEmail - Large invite code display, sign-up CTA
- Unsubscribe confirmation page - Beautiful success page

**Configuration (`.env`):**
```env
RESEND_API_KEY="re_Qy5majKW_BrzHGNjjMbYNB4FX1qPcjCyf"
NEXT_PUBLIC_APP_EMAIL="noreply@girlypopchat.com"
RESEND_FROM_NAME="GirlyPopChat"
```

**API endpoints:**
- `POST /api/email/send` - Admin endpoint to send any email
- `GET /api/email/preferences` - Get user's email preferences
- `POST /api/email/preferences` - Update user's email preferences
- `GET /api/email/unsubscribe?email=xxx&type=all|notifications|newsletters|marketing` - Unsubscribe

**Upcoming:**
- Add "Email" tab to settings page with preference toggles
- Wire notification emails to Socket.IO events (dm:send, follow, etc.)
- Admin newsletter sending endpoint
- Email analytics dashboard in admin console

---

## Docklite: Shared Database Between Containers

### The Problem

Docklite gives each site exactly one bind mount: its own code directory → `/app` inside the container. When two sites (e.g. the chat app and the console) need to share a SQLite database, the console container has no visibility into the chat app's filesystem — it can only see its own `/app`. Setting `DATABASE_URL="file:./dev.db"` in the console's `.env` points at `/app/prisma/dev.db` which is a completely separate file (or doesn't exist at all).

This happens any time you have:
- A SQLite DB in one docklite site's directory
- A second docklite site that needs to read/write that same DB

### The Fix

Recreate the consumer container with an extra bind mount pointing at the DB directory of the owning site, then update `DATABASE_URL` to an absolute path inside that mount.

```bash
# 1. Stop and remove the existing container
docker stop docklite-site-console-girlypopchat-com
docker rm docklite-site-console-girlypopchat-com

# 2. Recreate with the extra mount
#    -v <db-owner's prisma dir>:/shared-db
docker run -d \
  --name docklite-site-console-girlypopchat-com \
  --restart unless-stopped \
  -p 32854:3000 \
  -v /var/www/sites/stella/console.girlypopchat.com:/app \
  -v /var/www/sites/stella/secret.girlypopchat.com/prisma:/shared-db \
  node:20-alpine \
  sh -c 'npm install --legacy-peer-deps && npx prisma@6 generate && npm run build && npm start'

# 3. Update DATABASE_URL in the consumer site's .env
#    Use absolute path (file:/// prefix) not relative (file:./)
DATABASE_URL="file:///shared-db/dev.db"
```

### Important Notes

- **`file:./dev.db` vs `file:///shared-db/dev.db`**: The `./` form is relative to the prisma directory inside the container. Once you add an extra mount, you must switch to an absolute path.
- **WAL files**: SQLite in WAL mode creates `dev.db-wal` and `dev.db-shm` alongside the main file. Mounting the whole `prisma/` directory (not just the `.db` file) ensures all three files are accessible.
- **Docklite won't preserve the extra mount**: If docklite ever recreates the container from its own DB (e.g. after a redeploy through the UI), it will only restore the single default mount. You'll need to re-run the `docker run` command above manually. This is a docklite limitation — it has no concept of extra volume mounts per site.
- **The real fix long-term**: Migrate to PostgreSQL. A TCP-based DB doesn't have this problem — both containers just point their `DATABASE_URL` at the same host:port.

### Current State (as of 2026-03-22)

- `console.girlypopchat.com` container has the extra mount at `/shared-db`
- `DATABASE_URL="file:///shared-db/dev.db"` in `/var/www/sites/stella/console.girlypopchat.com/.env`
- Both apps read/write `/var/www/sites/stella/secret.girlypopchat.com/prisma/dev.db`

---

## Known Issues / Technical Debt

- **Room enhancement build**: Interrupted mid-build. Need to run `docker exec docklite-site-secret-girlypopchat-com npx next build && docker restart docklite-site-secret-girlypopchat-com` to finish deploying room types/modes/vibes.
- **Guardian permissions**: Schema has the `guardians` JSON field but socket handlers don't yet check it for room-level moderation actions.
- **Password-protected rooms**: `accessMode = 'password'` is stored but the join flow doesn't yet prompt for or validate a password.
- **LiveKit viewer support**: Broadcaster sees their own camera. Viewers joining a broadcast don't yet get the LiveKit token flow wired to actually render video — the socket events exist but the frontend LiveKit `<VideoConference />` component isn't wired up.
- **DM image sending**: The `dm:send` socket event accepts `imageUrl` but the DM panel UI doesn't yet have an image upload button (the Imgur upload flow from room chat could be reused).
- **Whitelist/blacklist**: Schema has `cameraWhitelist` and `cameraBlacklist` fields on User, but the UI to manage them and the socket enforcement aren't implemented yet.
- **Online status**: `showOnlineStatus = false` is saved but not yet enforced — all users appear online regardless of setting.
