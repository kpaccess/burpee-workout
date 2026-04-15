"use client";

import { useEffect, useMemo, useState } from "react";
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

const defaultState: SubscriptionState = {
  isPro: false,
  isTrialing: false,
  trialEndsAt: null,
  stripeCustomerId: null,
  subscriptionStatus: null,
  loading: true,
};

interface FirestoreSubscriptionState extends SubscriptionState {
  userId: string | null;
}

export function useSubscription(
  userId: string | null,
  userEmail?: string | null,
): SubscriptionState {
  const [state, setState] = useState<FirestoreSubscriptionState>({
    ...defaultState,
    userId: null,
  });
  const isAllowlistedUser = isAllowlisted(userEmail);

  useEffect(() => {
    if (isAllowlistedUser || !userId || !db) {
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
          userId,
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
          ...defaultState,
          userId,
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, [isAllowlistedUser, userId]);

  return useMemo(() => {
    if (isAllowlistedUser) {
      return {
        isPro: true,
        isTrialing: false,
        trialEndsAt: null,
        stripeCustomerId: null,
        subscriptionStatus: "active",
        loading: false,
      };
    }

    if (!userId || !db) {
      return {
        ...defaultState,
        loading: false,
      };
    }

    if (state.userId !== userId) {
      return {
        ...defaultState,
        loading: true,
      };
    }

    return state;
  }, [isAllowlistedUser, state, userId]);
}
