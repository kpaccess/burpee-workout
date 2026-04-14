"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { isAllowlisted } from "@/lib/allowlist";

interface SubscriptionState {
  isPro: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
  loading: boolean;
}

export function useSubscription(
  userId: string | null,
  userEmail?: string | null,
): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    isTrialing: false,
    trialEndsAt: null,
    stripeCustomerId: null,
    subscriptionStatus: null,
    loading: true,
  });

  useEffect(() => {
    // Allowlisted users (admin + friends/family) always get Pro
    if (isAllowlisted(userEmail)) {
      setState({
        isPro: true,
        isTrialing: false,
        trialEndsAt: null,
        stripeCustomerId: null,
        subscriptionStatus: "active",
        loading: false,
      });
      return;
    }

    if (!userId || !db) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const trialEndsAt = data.trialEndsAt as string | undefined;
        const isTrialActive =
          typeof trialEndsAt === "string" &&
          Number.isFinite(Date.parse(trialEndsAt)) &&
          Date.now() < Date.parse(trialEndsAt);

        setState({
          isPro: data.isPro === true || isTrialActive,
          isTrialing: isTrialActive,
          trialEndsAt: trialEndsAt ?? null,
          stripeCustomerId: data.stripeCustomerId ?? null,
          subscriptionStatus: isTrialActive
            ? "trialing"
            : (data.subscriptionStatus ?? null),
          loading: false,
        });
      } else {
        setState({
          isPro: false,
          isTrialing: false,
          trialEndsAt: null,
          stripeCustomerId: null,
          subscriptionStatus: null,
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, [userId, userEmail]);

  return state;
}
