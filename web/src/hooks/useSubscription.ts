'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface SubscriptionState {
  isPro: boolean;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
  loading: boolean;
}

export function useSubscription(userId: string | null): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    stripeCustomerId: null,
    subscriptionStatus: null,
    loading: true,
  });

  useEffect(() => {
    if (!userId || !db) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setState({
          isPro: data.isPro === true,
          stripeCustomerId: data.stripeCustomerId ?? null,
          subscriptionStatus: data.subscriptionStatus ?? null,
          loading: false,
        });
      } else {
        setState({ isPro: false, stripeCustomerId: null, subscriptionStatus: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return state;
}
