# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config, v9)
```

No test runner is configured. There is no `test` script.

## Architecture

**BurpeePacer** is a burpee workout tracker. Users follow structured programs (Beginner B1–B6 or Advanced 1A–4/Grad), log workouts, and unlock Pro features via Stripe subscription.

### Stack
- **Next.js App Router** (src/app/) — pages and API routes colocated
- **Firebase Auth** — client-side authentication
- **Firestore** — primary database (client via `firebase/firestore`, server via `firebase-admin`)
- **Stripe** — Pro subscription billing (webhook at `/api/stripe/webhook`)
- **MUI v7** dark theme + **Tailwind CSS v4** for styling
- **Resend** — transactional email

### Key Data Flow

`src/app/page.tsx` is the app shell. It renders conditionally: `LandingPage` → `Onboarding` → `MilestoneCheckin` → `Dashboard` based on auth/user state.

User data lives in a single Firestore doc (`users/{userId}`) containing profile, workout logs, and subscription status. `useUserData` (src/hooks/useUserData.ts) manages real-time sync and all writes. `useSubscription` (src/hooks/useSubscription.ts) computes Pro access, factoring in the allowlist and trial period.

### Subscription & Access Control
- **Stripe webhooks** update `isPro` and `subscriptionStatus` in Firestore
- **Allowlist** (`src/lib/allowlist.ts`): hardcoded emails get free Pro; `isAdmin()` gates the `/admin` route
- **Guest checkout**: Stripe session stores email in `pending_subscriptions` collection; claimed via `/api/claim-subscription` after signup
- `<ProGate>` component wraps any feature requiring Pro access

### Path Aliases
`@/*` maps to `src/*`. The project also imports from `../shared/workoutTimer.ts` (outside src/) — enabled via `experimental.externalDir: true` in next.config.ts.

### Environment Variables
Required (prefix `NEXT_PUBLIC_` for client-side Firebase vars):
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
- `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON string for admin SDK (falls back to GCP default credentials)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ADMIN_SECRET` — guards admin API routes
