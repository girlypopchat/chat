# GirlyPopChat Landing Page

Coming soon landing page with waitlist for girlypopchat.com

## Quick Start

```bash
bun install
cp .env.example .env
bun run db:push
bun run dev
```

## Deploy

```bash
bun run build
bun start
```

## Environment

- `DATABASE_URL` - SQLite database path (default: `file:./data.db`)
- `NEXT_PUBLIC_APP_URL` - Your domain (e.g., `https://girlypopchat.com`)
