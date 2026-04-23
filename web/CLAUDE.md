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
- **Firebase Auth** — client-side authentication via `src/context/AuthContext.tsx` (`useAuth` hook)
- **Firestore** — primary database (client via `src/lib/db.ts`, server via `firebase-admin`)
- **Stripe** — Pro subscription billing (webhook at `/api/stripe/webhook`)
- **MUI v7** dark theme + **Tailwind CSS v4** for styling
- **Resend** — transactional email via `src/lib/email.ts`

### Monorepo Structure

This is one of three packages under `/burpee-workout/`:
- `web/` — this Next.js app
- `mobile/` — Expo/React Native app (Expo SDK 54, expo-router, Firebase with AsyncStorage persistence)
- `shared/` — shared TypeScript logic: `workoutTimer.ts` (config builder) and `useWorkoutTimer.ts` (React hook)

### Key Data Flow

`src/app/page.tsx` is the app shell. It renders conditionally: `LandingPage` → `Onboarding` → `MilestoneCheckin` → `Dashboard` based on auth/user state.

User data lives in a single Firestore doc (`users/{userId}`). `useUserData` (`src/hooks/useUserData.ts`) manages all reads/writes. `useSubscription` (`src/hooks/useSubscription.ts`) computes Pro access, factoring in the allowlist and trial period. Types are defined in `src/types/index.ts`.

### Shared Logic (`../shared/`)

Imported via `experimental.externalDir: true` in `next.config.ts`.

- `shared/workoutTimer.ts` — `buildWorkoutTimerConfig()` builds tier-specific workout configs (modes, goals). Beginner: single (C) mode counting burpees. Advanced: two modes (N = Navy Seals, C = 6-counts) with separate goals.
- `shared/useWorkoutTimer.ts` — React hook wrapping the timer state machine.

### Subscription & Access Control
- **Stripe webhooks** update `isPro` and `subscriptionStatus` in Firestore
- **Allowlist** (`src/lib/allowlist.ts`): hardcoded emails get free Pro; `isAdmin()` gates `/admin` (verified server-side against `ADMIN_EMAIL`)
- **Guest checkout**: Stripe session stores email in `pending_subscriptions` collection; claimed via `/api/claim-subscription` after signup
- `<ProGate>` (`src/components/ProGate.tsx`) wraps any feature requiring Pro access
- Trial period: 60 days from `startDate`, stored as `trialEndsAt` in user doc

### API Routes

| Route | Purpose |
|---|---|
| `/api/stripe/checkout` | Create Stripe checkout session |
| `/api/stripe/portal` | Open Stripe billing portal |
| `/api/stripe/webhook` | Handle Stripe events → update Firestore |
| `/api/claim-subscription` | Link guest Stripe payment to new Firebase user |
| `/api/send-welcome-email` | Send welcome email via Resend (deduped via `welcomeEmailSent` flag) |
| `/api/analytics/visit` | Increment page view counter |
| `/api/admin/stats` | Admin-only: user list + analytics (verified by Firebase ID token) |

### Path Aliases
`@/*` maps to `src/*`.

### Environment Variables
Required (prefix `NEXT_PUBLIC_` for client-side Firebase vars):
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
- `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON string for admin SDK (falls back to GCP default credentials)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ADMIN_SECRET` — guards admin API routes
- `EMAIL_FROM` — sender address for Resend (default: `BurpeePacer <hello@burpeepacers.com>`)
