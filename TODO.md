# GirlyPopChat - Feature Roadmap

## Completed

### Login Flow (Unified OAuth + Email)
- Email magic link via Stytch alongside Google/Discord/Apple OAuth
- Both auth paths route through the same callback handler
- Flow: login -> age verify -> identity setup -> chat

### Identity System
- First name: free text (max 30 chars)
- Last name: curated word list (~110 names) with matching emoji, organized by category (Nature, Celestial, Sweet, Magical, Elements, Creatures, Aesthetic)
- Gender icons: Feminine, Nonbinary, Masculine -- no policing, just self-expression
- Display modes: full name, first only, emoji only, hidden
- Live preview during setup

### Auth Flow Routing
- New users go through: `/login` -> `/verify` (age) -> `/setup` (identity) -> `/chat`
- Returning users skip straight to `/chat`
- Session cookies shared across subdomains (`.girlypopchat.com`)

---

## Priority 2 - This Week

### Circle System (Fans, Faves, Moots, Besties)
The social graph. Four tiers with different permissions:
- **Fans** -- They follow you. Can see public rooms, online status, send fan mail (1/day), wave. Cannot DM.
- **Faves** -- You follow them (secret). Private crush list; you get join notifications, secret stats. They never know.
- **Moots** -- Mutual follow. DM access, see online status, request private rooms. Casual mutuals.
- **Besties** -- Mutual + trust upgrade. Auto-join private rooms, co-host privileges, special badges, trusted access.

Needs: Follow/unfollow API, mutual detection logic, circle tier DB models, permission checks throughout the app.

### User Settings / Profile Page
- Edit identity (first name, last name, gender icon, display mode)
- Privacy controls (who can see camera, DM settings, online status visibility)
- Account management (linked auth methods, logout everywhere)
- Notification preferences

### DM System
Requires Moots or Besties circle tier. Direct messaging between users with:
- Real-time delivery via Socket.IO
- Read receipts
- Image sharing (existing Imgur upload)
- Conversation list in sidebar

### @Mentions with Tab Autocomplete
- Type `@` in chat to trigger autocomplete dropdown
- Tab to select from matching usernames
- Mentioned users get highlighted notification
- Works in both room chat and DMs

---

## Priority 3 - April Launch

### Room System Enhancements
Current rooms are basic text chat. Need to add:
- **Room types**: Text, Video-first, Music (YouTube queue + voting), Cinema (screen share), Events (petition system), Rave (all video no chat), Library (all text, structured, quiet)
- **Room modes**: Public, Password-protected, Secret (invite-only)
- **Vibe presets**: Cozy, Party, Focus, Sleepover -- affects UI theme/layout within room
- **Guardian roles**: The 5 room creators become Guardians with moderation powers for that room
- **Room limits**: Each user can be Guardian of max 2 rooms; deleting frees a slot

### Privacy & Camera System
Granular control over who sees your broadcast:
- **Viewing rules**: Same room = can see; Circle members = can see (with per-user exceptions); Invite overrides everything; Request to view with approve/deny/auto
- **Whitelist & blacklist** per user
- **Global privacy modes**: Open (circle can see), Private (ask me first), Invisible (invite only)
- **Broadcast indicators**: LIVE (broadcasting), READY (camera on, no viewers), HIDDEN (camera on, circle only), PRESENT (in room, camera off)
- **Panic button**: "Who's watching?" shows current viewers instantly

### Display Modes & Themes
- **Layouts**: Widescreen, dual monitor, compact, picture-in-picture, streamer mode, focus mode (audio only), event mode, power dashboard. User presets saved in DB (roaming across devices).
- **Color modes**:
  - Rainbow Mode -- rotating pastels (pink, yellow, baby blue, lavender, mint)
  - Light Mode -- pastel pink, yellow, blue, white
  - Dark Mode -- sleek, muted
  - Camo Mode -- masculine-coded theme that's so patronizing of men it might go over their heads
- **Patronization UI**: Subtly condescending messages everywhere ("You're doing great, sweetie!", 404: "Page playing hide and seek. So clever.")

### Currency System (Strict Firewall)
Two currencies that NEVER interchange:
- **Strawberries**: Cosmetic currency. Buy with real money OR passive generation (+1/30 sec if you've logged in within 24h). Spend on badges, sparkles, themes, mini-game gambling, gifting items (not currency). No cash-out, no exchange with Diamonds.
- **Diamonds**: Creator economy. Buy with real money or receive as gifts. Gift to creators only. Creators cash out via Stripe. No cosmetic spending, no P2P transfers, no exchange with Strawberries.
- **1-Strawberry absurd items**: "A Single Sparkle", "A Wave", "ur ok", Mystery Box (nothing inside), "Exhibit A" (PDF of WA ruling with bow)
- **Legal shield**: Free generation means no forced purchases; items have no real-world value

### Events System
- **Petition flow**: User proposes event -> needs X co-signers -> event confirmed -> notifications
- **Event types & minimums**: Movie night (15), Karaoke (10), Panel (20), Game night (8), Workshop (12), Listening party (10), Tournament (25)
- **Features**: Host reputation (Event Cred), attendee badges, recurring events, spotlight events, cross-room collaborations

### Moderation
- **The only rule**: "Don't be sus." -- enforced by vibe. Also be 18+.
- **Supershadowban**: User is told they're shadowbanned. They can still buy things and send messages, but nobody else sees them. They fund the platform invisibly.
- Strike system with severity levels and expiration

### Gamification / Dark Patterns
- FOMO notifications ("Your bestie is online!")
- Collection psychology (badge sets)
- Status tiers: Newbie -> Regular -> Vibe Setter -> Legend
- Intermittent rewards (random badge drops)
- Limited editions (real scarcity)
- Mystery boxes, social gifting, loss aversion ("VIP expires in 3 days")

---

## Backlog

- Invite-only signup flow (waitlist -> invite codes -> registration)
- Real age verification provider (A3 free tier, 50k checks/month)
- LiveKit viewer support (currently only broadcaster sees own camera)
- Discord/Apple OAuth testing
- Email notifications for waitlist invites
- Stripe integration for Strawberries + Diamond cashout
