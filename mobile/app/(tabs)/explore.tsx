import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChanged, User } from "firebase/auth";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../lib/firebase";
import { getUserData, saveUserDataDB } from "../../lib/db";
import {
  ADVANCED_LEVELS,
  BEGINNER_LEVELS,
  LevelDescription,
  UserData,
  WorkoutTier,
} from "../../types";

export default function ProgramScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const ud = await getUserData(u.uid);
          setUserData(ud || null);
        } catch {
          setSyncError("Failed to load data.");
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateLevel = async (levelId: string) => {
    if (!user || !userData) return;
    const next = { ...userData, currentLevelId: levelId };
    setUserData(next);
    try {
      await saveUserDataDB(user.uid, { currentLevelId: levelId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSyncError("Failed to update level.");
    }
  };

  const switchProgram = async (targetTier: WorkoutTier) => {
    if (!user || !userData) return;
    const newLevelId = targetTier === "beginner" ? "B1" : "1B";
    const updates = { workoutTier: targetTier, currentLevelId: newLevelId };
    setUserData({ ...userData, ...updates });
    try {
      await saveUserDataDB(user.uid, updates);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSyncError("Failed to switch program.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  if (!user || !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>Sign in on the Home tab to view your program.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const inferTier = (): WorkoutTier => {
    if (userData.workoutTier) return userData.workoutTier;
    return userData.currentLevelId && /^B[1-6]$/.test(userData.currentLevelId)
      ? "beginner"
      : "advanced";
  };

  const tier = inferTier();
  const levels: LevelDescription[] = tier === "beginner" ? BEGINNER_LEVELS : ADVANCED_LEVELS;
  const otherTier: WorkoutTier = tier === "beginner" ? "advanced" : "beginner";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.pageTitle}>Program</Text>

        {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

        {/* Current Program Card */}
        <View style={styles.programCard}>
          <View style={styles.programCardHeader}>
            <Ionicons
              name={tier === "beginner" ? "body-outline" : "flash-outline"}
              size={20}
              color={tier === "beginner" ? "#FF3366" : "#00E5FF"}
            />
            <Text style={[styles.programCardTitle, { color: tier === "beginner" ? "#FF3366" : "#00E5FF" }]}>
              {tier === "beginner" ? "Beginner Track" : "Advanced Track"}
            </Text>
          </View>
          <Text style={styles.programCardDesc}>
            {tier === "beginner"
              ? "Burpees without pushups · 6 levels (B1–B6)"
              : "Navy Seals + 6-counts · 8 levels (1A–Grad)"}
          </Text>
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => switchProgram(otherTier)}
          >
            <Ionicons name="swap-horizontal-outline" size={14} color="#888" style={{ marginRight: 6 }} />
            <Text style={styles.switchBtnText}>
              Switch to {otherTier === "beginner" ? "Beginner" : "Advanced"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Levels */}
        <Text style={styles.sectionTitle}>Levels</Text>
        {levels.map((lvl) => {
          const isCurrent = userData.currentLevelId === lvl.id;
          return (
            <TouchableOpacity
              key={lvl.id}
              style={[styles.levelRow, isCurrent && styles.levelRowActive]}
              onPress={() => updateLevel(lvl.id)}
              activeOpacity={0.7}
            >
              <View style={styles.levelRowLeft}>
                <View style={[styles.levelBadge, isCurrent && styles.levelBadgeActive]}>
                  <Text style={[styles.levelBadgeText, isCurrent && styles.levelBadgeTextActive]}>
                    {lvl.id}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelName, isCurrent && { color: "#fff" }]}>{lvl.name}</Text>
                  <Text style={styles.levelDesc}>{lvl.description}</Text>
                </View>
              </View>
              {isCurrent && (
                <Ionicons name="checkmark-circle" size={20} color="#FF3366" />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Other Track Preview */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
          {otherTier === "beginner" ? "Beginner Track" : "Advanced Track"}
        </Text>
        <View style={styles.otherTrackCard}>
          <Text style={styles.otherTrackDesc}>
            {otherTier === "beginner"
              ? "6 levels of burpees without pushups. Great for building a baseline fitness habit."
              : "8 levels combining Navy Seals (full burpees) and 6-count burpees. Requires Pro subscription."}
          </Text>
          <TouchableOpacity
            style={[styles.switchBtn, { marginTop: 12, alignSelf: "flex-start" }]}
            onPress={() => switchProgram(otherTier)}
          >
            <Text style={styles.switchBtnText}>Switch to this program</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060606" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: "#555",
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: { color: "#ff6b6b", marginBottom: 12 },
  pageTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 24,
  },
  programCard: {
    backgroundColor: "#111",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  programCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  programCardTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  programCardDesc: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchBtnText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    borderColor: "#1e1e1e",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  levelRowActive: {
    borderColor: "#FF3366",
    backgroundColor: "rgba(255,51,102,0.06)",
  },
  levelRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadgeActive: {
    backgroundColor: "rgba(255,51,102,0.15)",
    borderColor: "#FF3366",
  },
  levelBadgeText: {
    color: "#555",
    fontWeight: "800",
    fontSize: 11,
  },
  levelBadgeTextActive: {
    color: "#FF3366",
  },
  levelName: {
    color: "#aaa",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  levelDesc: {
    color: "#555",
    fontSize: 12,
    lineHeight: 17,
  },
  otherTrackCard: {
    backgroundColor: "#0d0d0d",
    borderColor: "#1a1a1a",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  otherTrackDesc: {
    color: "#666",
    fontSize: 13,
    lineHeight: 20,
  },
});
