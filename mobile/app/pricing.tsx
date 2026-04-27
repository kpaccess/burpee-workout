import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { openAuthSessionAsync } from "expo-web-browser";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserData } from "../types";

const PRO_FEATURES = [
  "Full calendar history (all time)",
  "Export workout data (CSV)",
  "Advanced workout timer with intervals",
  "Priority support",
];

const BEGINNER_FEATURES = [
  "Beginner workout track",
  "Included in 60-day launch free access",
  "Core progress tracking",
];

const TRUST_BADGES = [
  { icon: "🔒", label: "Secure payments via Stripe" },
  { icon: "↩️", label: "Cancel anytime" },
  { icon: "⚡", label: "Instant access after payment" },
];

export default function PricingScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }
      setUser(u);
      setAuthReady(true);
      if (u && db) {
        unsubSnapshot = onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserData;
            const trialActive =
              typeof data.trialEndsAt === "string" &&
              Date.now() < Date.parse(data.trialEndsAt);
            setIsPro(data.isPro === true || trialActive);
          } else {
            setIsPro(false);
          }
        });
      } else {
        setIsPro(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/");
      return;
    }
    if (isPro) return;

    const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
    if (!webUrl) {
      Alert.alert("Configuration error", "Web URL not configured.");
      return;
    }

    setLoadingCheckout(true);
    try {
      const resp = await fetch(`${webUrl}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          successUrl: "burpeepacer://payment-success",
          cancelUrl: "burpeepacer://pricing",
        }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }

      const { url } = await resp.json();
      if (!url) throw new Error("No checkout URL returned");

      const result = await openAuthSessionAsync(url, "burpeepacer://");
    } catch (err: any) {
      Alert.alert("Checkout error", err.message ?? "Something went wrong.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnArrow}>←</Text>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workout Tracks</Text>
          <Text style={styles.headerSubtitle}>
            All users get 60-day launch free access from their start date.
          </Text>
        </View>

        {/* Beginner Card */}
        <View style={styles.beginnerCard}>
          <View style={styles.beginnerBadge}>
            <Text style={styles.beginnerBadgeText}>BEGINNER</Text>
          </View>
          <Text style={styles.priceText}>Free</Text>
          <Text style={styles.priceSub}>Available during launch free period</Text>
          <View style={styles.divider} />
          {BEGINNER_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.checkCyan}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.outlineBtnText}>Use Beginner Track</Text>
          </TouchableOpacity>
        </View>

        {/* Advanced Card */}
        <View style={styles.advancedCardWrapper}>
          <View style={styles.advancedBadgeAbsolute}>
            <Text style={styles.advancedBadgeText}>⭐ ADVANCED</Text>
          </View>
          <View style={styles.advancedCard}>
            <View style={styles.priceRow}>
              <Text style={styles.advancedPrice}>$4.99</Text>
              <Text style={styles.advancedPricePer}> / month</Text>
            </View>
            <Text style={styles.priceSub}>Paid subscription</Text>
            <View style={styles.divider} />
            {PRO_FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.checkGold}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.upgradeBtn, (loadingCheckout || isPro) && { opacity: 0.7 }]}
              onPress={handleUpgrade}
              disabled={loadingCheckout || isPro}
            >
              {loadingCheckout ? (
                <ActivityIndicator color="#fff" />
              ) : isPro ? (
                <Text style={styles.upgradeBtnText}>✓ You are on Pro</Text>
              ) : !authReady || !user ? (
                <Text style={styles.upgradeBtnText}>⭐ Sign in to Unlock Advanced</Text>
              ) : (
                <Text style={styles.upgradeBtnText}>⭐ Upgrade to Advanced — $4.99/mo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          {TRUST_BADGES.map(({ icon, label }) => (
            <View key={label} style={styles.trustBadge}>
              <Text style={styles.trustIcon}>{icon}</Text>
              <Text style={styles.trustLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>🔒</Text>
          <Text style={styles.footerNoteBody}>
            Advanced features and premium content require a paid subscription
            after your 60-day launch free access ends.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CYAN = "#00E5FF";
const GOLD = "#f59e0b";
const RED = "#ef4444";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060606",
  },
  container: {
    flex: 1,
    backgroundColor: "#060606",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },
  backBtnArrow: {
    color: "#aaa",
    fontSize: 18,
  },
  backBtnText: {
    color: "#aaa",
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: GOLD,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  // Beginner card
  beginnerCard: {
    backgroundColor: "rgba(0,229,255,0.06)",
    borderColor: "rgba(0,229,255,0.3)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  beginnerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,229,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  beginnerBadgeText: {
    color: CYAN,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  priceText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  priceSub: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  checkCyan: {
    color: CYAN,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 1,
  },
  checkGold: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 1,
  },
  featureText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  outlineBtn: {
    marginTop: 16,
    borderColor: "rgba(0,229,255,0.35)",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  // Advanced card
  advancedCardWrapper: {
    position: "relative",
    marginBottom: 28,
    marginTop: 10,
  },
  advancedBadgeAbsolute: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  advancedBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  advancedCard: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.45)",
    borderWidth: 2,
    borderRadius: 20,
    padding: 24,
    paddingTop: 28,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  advancedPrice: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
  },
  advancedPricePer: {
    fontSize: 16,
    color: "#888",
  },
  upgradeBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: GOLD,
  },
  upgradeBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  // Trust badges
  trustRow: {
    gap: 10,
    marginBottom: 20,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trustIcon: {
    fontSize: 16,
  },
  trustLabel: {
    color: "#666",
    fontSize: 13,
  },
  // Footer note
  footerNote: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  footerNoteText: {
    fontSize: 16,
    marginTop: 1,
  },
  footerNoteBody: {
    color: "#666",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
});
