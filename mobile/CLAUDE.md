# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server (scan QR code with Expo Go)
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run lint           # Run ESLint
```

No test runner is configured.

## Architecture

This is the **BurpeePacer** Expo/React Native mobile app — a burpee workout tracker that shares a Firebase/Firestore backend with the web app (`../web`).

### Stack
- **Expo SDK 54** + **expo-router ~6** — file-based routing (similar to Next.js App Router)
- **Firebase 12** — same project as web; auth uses `initializeAuth` with `getReactNativePersistence(AsyncStorage)` for session persistence
- **React Navigation bottom tabs** — two tabs: Home and Explore
- **expo-image-picker** — camera/gallery access for progress photos (base64 data URLs)
- **expo-haptics** — feedback on workout log toggling and level updates
- **expo-audio** — timer sound effects

### App Structure

```
app/
  _layout.tsx          # Root layout: SafeAreaProvider + Stack navigator
  (tabs)/
    _layout.tsx        # Tab bar with Home + Explore tabs
    index.tsx          # ENTIRE app logic (landing, auth, onboarding, dashboard)
    explore.tsx        # Placeholder (default Expo template)
  modal.tsx            # Generic modal screen
components/
  WorkoutTimer.tsx     # 20-min workout timer component
  haptic-tab.tsx       # Tab bar button with haptic feedback
  themed-text.tsx      # Theme-aware Text
  themed-view.tsx      # Theme-aware View
  ui/                  # Icon primitives (IconSymbol)
lib/
  firebase.ts          # Firebase init with AsyncStorage persistence
  db.ts                # getUserData, saveUserDataDB, logWorkoutDB
  workoutTimer.ts      # Copy of shared timer config (NOT imported from ../shared)
hooks/
  useWorkoutTimer.ts   # Timer state machine hook
  use-color-scheme.ts  # System dark/light mode detection
types/
  index.ts             # UserData, WorkoutLog, LevelDescription, ADVANCED_LEVELS, BEGINNER_LEVELS
```

### Key Architecture Note

**`app/(tabs)/index.tsx` is a monolithic file (~1900 lines)** containing all auth, onboarding, and dashboard state in a single `HomeScreen` component. There are no custom hooks or context — all Firestore reads/writes, auth state, workout logging, calendar rendering, and modals are colocated here.

Unlike the web app, the mobile app:
- Does **not** use a shared `AuthContext` — auth state is managed locally with `onAuthStateChanged` directly in `HomeScreen`
- Does **not** check Pro/subscription status — no `useSubscription` hook, no `ProGate`, no Stripe integration
- Has a **copy** of the timer logic in `lib/workoutTimer.ts` rather than importing from `../shared/`
- `WorkoutLog.workoutType` is typed as `"N" | "C"` (vs web's `"with_pushups" | "no_pushups"`)

### Shared Data Model

Reads/writes the same `users/{userId}` Firestore doc as the web app. The `UserData` type in `types/index.ts` is a subset — it omits subscription fields (`isPro`, `stripeCustomerId`, etc.) since those are web-only.

### Environment Variables

Prefixed with `EXPO_PUBLIC_` (vs `NEXT_PUBLIC_` on web):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

Copy `.env.example` to `.env` and fill in values from the Firebase project (`burpee-workout`).

### Path Aliases
`@/*` maps to the project root (configured in `tsconfig.json`).
