# Wealth

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_vBjN8xEINQ9CGzAlSTegbsNWNAH9)

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret |
| `INTERNAL_API_KEY` | Yes | Random secret for scheduler/internal API calls (`x-api-key` header) |
| `GOLD_API_KEY` | Optional | goldapi.io key for XAU/IDR price (free tier: 100 req/month). Falls back to CoinGecko + open exchange rate if absent. |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID (Google Cloud Console → APIs & Services → Credentials) |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |

### Market Price Update Flow

`POST /api/market/prices/update` (requires `x-api-key: <INTERNAL_API_KEY>` header):
1. Queries all distinct tickers from every user's holdings
2. **Stocks** (IDX): fetches via Yahoo Finance `/v8/finance/chart/{ticker}.JK` → price in IDR
3. **Crypto**: resolves symbol → CoinGecko ID via search, then fetches `simple/price` → price in USD
4. **Gold** (XAU): fetches from goldapi.io (`GOLD_API_KEY`) or falls back to CoinGecko tether-gold × USD/IDR
5. Upserts all prices to `asset_prices`

Manual single-ticker override: `PUT /api/market/prices/{ticker}` (requires user session).

## Demo Account

The app is open for anyone to try without signing up. Use:

| Field    | Value              |
| -------- | ------------------ |
| Email    | demo@mailinator.com |
| Password | demo1234           |

The demo account is **read-only**. You can browse every page and see sample
data, but any attempt to add, edit, or delete will:

1. **Server**: return `401 Unauthorized` from `POST/PUT/PATCH/DELETE` on
   `/api/*` (enforced by `src/proxy.ts` checking `session.user.isDemo`).
2. **UI**: open a "Demo account" notice dialog explaining the limitation,
   *before* the network request is fired (via `useGuardedMutation`).

### How a user is marked as demo

The `users` table has an `is_demo BOOLEAN DEFAULT FALSE` column. Only rows
where `is_demo = true` are subject to the read-only guard.

### Seeding / resetting the demo account

```bash
pnpm seed:demo
```

Creates the demo user (idempotent) and inserts a minimal portfolio (bank +
cash accounts, one stock, one crypto, one transaction) so the dashboard is
non-empty. See `seed/demo/README.md` for details.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/rizkiandrianto/v0-wealth-management" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
