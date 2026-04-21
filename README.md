# Burpee Workout

A cross-platform burpee workout tracker with a Next.js web app and an Expo mobile app, backed by Firebase and Stripe.

## Structure

```
burpee-workout/
├── web/        # Next.js web app (MUI, Tailwind, Stripe subscriptions)
├── mobile/     # Expo / React Native app
├── shared/     # Shared TypeScript logic (workout timer config & helpers)
└── firestore.rules
```

## Features

- **Beginner & Advanced tiers** — beginner sessions count burpees without pushups; advanced unlocks Navy Seals (full range) and 6-Count modes
- **Workout timer** — configurable session length with per-mode goals
- **Workout log** — tracks daily sessions and milestone check-ins
- **Pro subscription** — Stripe-powered, managed server-side via webhooks
- **Firebase Auth + Firestore** — user data synced across web and mobile

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project (`burpee-workout`) with Firestore and Auth enabled
- Stripe account (for web subscription features)

### Web

```bash
cd web
npm install
# Copy .env.local.example to .env.local and fill in Firebase + Stripe keys
npm run dev
```

### Mobile

```bash
cd mobile
npm install
# Copy .env.example to .env and fill in Firebase keys
npx expo start
```

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `web/` | `npm run dev` | Start Next.js dev server |
| `web/` | `npm run build` | Production build |
| `web/` | `npm run lint` | Lint |
| `mobile/` | `npm start` | Start Expo dev server |
| `mobile/` | `npm run ios` | Run on iOS simulator |
| `mobile/` | `npm run android` | Run on Android emulator |
| `mobile/` | `npm run lint` | Lint |

## Firebase

Firestore security rules are in `firestore.rules`. Deploy with:

```bash
firebase deploy --only firestore:rules
```

Subscription fields (`isPro`, `stripeCustomerId`, etc.) are written exclusively by the server-side Admin SDK and are protected from client writes.
