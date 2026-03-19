# GirlyPopChat

**Video Chat for Nice People** — A curated video chat community built with modern infrastructure.

## 🏗️ Tech Stack

| Component | Service | Purpose |
|-----------|---------|---------|
| **Auth** | [Stytch](https://stytch.com) | OAuth (Google, Discord, Apple), Session Management |
| **Age Verification** | [k-ID / AgeKey](https://k-id.com) | Sub-cent age verification, reusable credentials |
| **Video** | [LiveKit](https://livekit.io) | WebRTC, broadcasting, viewer approval |
| **Realtime** | [Socket.IO](https://socket.io) | Chat, presence, events |
| **Image Upload** | [Imgur](https://imgur.com) | Free image hosting for chat images |
| **Database** | Prisma + SQLite | User data, messages, settings |
| **Frontend** | Next.js 15 + React 19 | App Router, Server Components |

---

## ✨ Features

### Chat Features
- **💬 Real-time Messaging** - Instant message delivery via Socket.IO
- **✏️ Edit Messages** - Fix typos, update your messages anytime
- **🗑️ Delete Messages** - Remove messages you regret sending
- **😊 Emoji Reactions** - React to messages with emoji (👍❤️😂😮😢😡🔥👏🎉😅)
- **↩️ Reply to Messages** - Quote-reply to specific messages
- **🖼️ Image Sharing** - Paste images from clipboard → auto-upload to Imgur → display in chat
- **⌨️ Typing Indicators** - See when others are typing

### Video Features
- **📹 Live Broadcasting** - Go live with camera or screen share
- **🔒 Locked Broadcasts** - Require approval for viewers to join
- **👥 Viewer Management** - Accept/decline view requests
- **👁️ Viewer Count** - Real-time viewer statistics

### Community Features
- **🔞 Age Verification** - k-ID/AgeKey integration (sub-cent per verification)
- **🛡️ Trust Scores** - Users earn reputation over time
- **👻 Shadowblock** - Silently block problematic users
- **🎟️ Invite System** - Curated community access
- **🏠 Room Quorum** - Need 5 sponsors to create new rooms (prevents spam)

---

## 🚀 Quick Start

```bash
# Clone and install
cd gpc-final
bun install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Set up database
bun run db:push
bun run db:seed    # Creates default rooms (lobby, general, gaming, music, selfies)

# Start dev servers
bun run dev:all
```

**Default Rooms:**
| Room | Description |
|------|-------------|
| 🏠 Lobby | Welcome area, meet new people |
| 💬 General | Random conversations |
| 🎮 Gaming | Games, teammates, clips |
| 🎵 Music | Share what you're listening to |
| 📸 Selfies | Share your pics, get compliments |

**Services:**
- Frontend: http://localhost:3000
- Socket.IO: ws://localhost:3001

---

## 🔑 Required API Keys

### 1. Stytch (Authentication)
1. Go to [stytch.com/dashboard](https://stytch.com/dashboard)
2. Create a new project
3. Enable OAuth providers: Google, Discord, Apple
4. Add redirect URL: `http://localhost:3000/api/auth/callback`
5. Copy keys to `.env`:
   - `STYTCH_PROJECT_ID`
   - `STYTCH_SECRET`
   - `STYTCH_PUBLIC_TOKEN`

### 2. k-ID / AgeKey (Age Verification)
1. Go to [k-id.com](https://k-id.com) or [docs.ageapi.org](https://docs.ageapi.org)
2. Create a project
3. Copy keys to `.env`:
   - `KID_API_KEY`
   - `KID_PROJECT_ID`
   - `KID_WEBHOOK_SECRET`

### 3. LiveKit (Video)
1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Create a project
3. Copy keys to `.env`:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_URL`

### 4. Imgur (Image Uploads) - Optional
1. Go to [api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient)
2. Choose "Anonymous usage without callback URL"
3. Copy Client ID to `.env`:
   - `IMGUR_CLIENT_ID`

**Note:** Without Imgur, images will show placeholders. The app still works.

---

## 📁 Project Structure

```
gpc-final/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Stytch OAuth
│   │   │   ├── age/            # k-ID verification
│   │   │   ├── upload/         # Imgur image upload
│   │   │   └── broadcast/      # LiveKit tokens
│   │   ├── chat/               # Main chat interface
│   │   ├── login/              # OAuth login
│   │   └── verify/             # Age verification
│   ├── components/
│   │   └── ui/                 # Radix UI components
│   └── lib/
│       ├── auth.ts             # Stytch integration
│       ├── age-verification.ts # k-ID integration
│       ├── livekit.ts          # Video tokens
│       └── db.ts               # Prisma client
├── mini-services/
│   └── chat-server/            # Socket.IO server
├── prisma/
│   └── schema.prisma           # Database schema
└── .env.example
```

---

## 🔄 User Flow

### Authentication
```
User clicks "Sign in with Google/Discord/Apple"
        ↓
Stytch OAuth redirect
        ↓
User authorizes
        ↓
/api/auth/callback → Create session
        ↓
Redirect to /verify (if not age verified)
    or /chat (if verified)
```

### Age Verification
```
User visits /verify
        ↓
Click "Verify Age"
        ↓
k-ID iframe/modal opens
        ↓
User uses existing AgeKey OR verifies with ID/Face
        ↓
Webhook → /api/age/webhook
        ↓
User.ageVerified = true
        ↓
Redirect to /chat
```

### Broadcasting
```
User clicks "Go Live"
        ↓
Socket emit 'startBroadcast'
        ↓
Server generates LiveKit broadcaster token
        ↓
User connects to LiveKit room
        ↓
Viewers request to view → 'viewRequest'
        ↓
Broadcaster approves/denies → 'viewResponse'
        ↓
Approved viewers get LiveKit viewer token
```

### Image Sharing
```
User copies image to clipboard (screenshot, copy image, etc.)
        ↓
User pastes in chat (Ctrl+V / Cmd+V)
        ↓
Frontend converts to base64
        ↓
POST /api/upload/imgur → Imgur API
        ↓
Returns Imgur URL
        ↓
Socket emit 'message' with imageUrl
        ↓
All users see image in chat
```

---

## 🎮 Socket.IO Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `joinRoom` | `{ roomId }` | Join a chat room |
| `leaveRoom` | `{ roomId }` | Leave current room |
| `message` | `{ content, roomId, replyToId?, imageUrl? }` | Send chat message |
| `editMessage` | `{ messageId, content }` | Edit your message |
| `deleteMessage` | `{ messageId }` | Delete your message |
| `addReaction` | `{ messageId, emoji }` | Add/remove emoji reaction |
| `typing` | `{ roomId, isTyping }` | Typing indicator |
| `startBroadcast` | `{ source, locked? }` | Start streaming |
| `stopBroadcast` | - | End stream |
| `viewRequest` | `{ broadcasterId }` | Request to view stream |
| `viewResponse` | `{ viewerId, approved }` | Approve/deny viewer |
| `poke` | `{ userId }` | Poke a user |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `message` | `{ _id, userId, name, text, imageUrl?, reactions?, replyTo?, ... }` | New chat message |
| `messageEdited` | `{ messageId, content, isEdited }` | Message was edited |
| `messageDeleted` | `{ messageId }` | Message was deleted |
| `messageReacted` | `{ messageId, reactions[] }` | Reactions updated |
| `userJoin` | `{ roomId, user }` | User joined room |
| `userLeave` | `{ roomId, userId }` | User left room |
| `userTyping` | `{ userId, username, isTyping }` | Typing status |
| `broadcastStarted` | `{ broadcasterId, roomName, ... }` | Someone went live |
| `broadcastStopped` | `{ broadcasterId }` | Stream ended |
| `viewRequest` | `{ viewerId, viewerName, ... }` | Someone wants to view |
| `viewResponse` | `{ approved, token?, ... }` | View approved/denied |
| `poke` | `{ senderId, senderName }` | You got poked |

---

## 💰 Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Stytch | 10,000 MAUs | $0.02/MAU |
| k-ID AgeKey | - | <$0.01/verification |
| LiveKit Cloud | 2,000 mins/month | $0.0015/min |
| Imgur | 1,250 uploads/day | Free for anonymous |
| Socket.IO | Self-hosted | Free |

**Estimated per user cost: ~$0.01-0.03**

---

## 🔒 Security Features

- **Age Verification Required** - No access without k-ID verification
- **Trust Scores** - Users earn reputation over time
- **Shadowblock** - Silently block problematic users
- **Broadcast Locking** - Require approval for viewers
- **Rate Limiting** - Prevent spam
- **Session Validation** - Every socket connection validates session

---

## 🖼️ Using Image Sharing

1. **Take a screenshot** - Use your OS screenshot tool
2. **Copy an image** - Right-click → Copy Image
3. **Paste in chat** - Click the input box and press Ctrl+V (Windows/Linux) or Cmd+V (Mac)
4. **Image uploads automatically** - Shows uploading state, then displays in chat

Images are uploaded to Imgur as anonymous (no account required). The URL is stored in the message and displayed inline.

---

## 📝 License

MIT
