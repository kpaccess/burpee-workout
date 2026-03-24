import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  differenceInDays,
  addMonths,
  isAfter,
  subDays,
  format,
} from "date-fns";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../../lib/firebase";
import { getUserData, saveUserDataDB } from "../../lib/db";
import { UserData, LEVELS, WorkoutLog } from "../../types";

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Forms
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Onboarding Forms
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [day1PictureDraft, setDay1PictureDraft] = useState<string | null>(null);
  const [syncError, setSyncError] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("1B");
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState("");
  const [checkinPicture, setCheckinPicture] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const ud = await getUserData(u.uid);
          setUserData(ud || null);
          setSyncError("");
        } catch (e) {
          console.error("Error fetching data:", e);
          setSyncError("Failed to load your data from Firebase.");
        }
      } else {
        setUserData(null);
        setSyncError("");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    setAuthError("");
    try {
      if (isLoginFlow) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const startProgram = async () => {
    if (!weight || !user) return;
    const newData: UserData = {
      startDate: date,
      startWeight: parseFloat(weight),
      startPictureUrl: day1PictureDraft,
      currentLevelId: selectedLevelId,
      workoutLogs: [],
    };
    try {
      await saveUserDataDB(user.uid, newData);
      setUserData(newData);
      setSyncError("");
    } catch (e) {
      console.error("Error saving onboarding data:", e);
      setSyncError("Failed to save your onboarding data.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const pickImageDataUrl = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setSyncError("Permission denied for photo access.");
        return null;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            base64: true,
          });

      if (result.canceled || !result.assets?.length) return null;

      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || "image/jpeg";
        return `data:${mimeType};base64,${asset.base64}`;
      }

      return asset.uri;
    } catch (e) {
      console.error("Image picker error:", e);
      setSyncError("Unable to access image picker.");
      return null;
    }
  };

  const pickDay1PictureDraft = async () => {
    const img = await pickImageDataUrl(false);
    if (img) {
      setDay1PictureDraft(img);
      setSyncError("");
    }
  };

  const replaceDay1Picture = async () => {
    if (!user || !userData) return;
    const img = await pickImageDataUrl(false);
    if (!img) return;

    const next = { ...userData, startPictureUrl: img };
    setUserData(next);

    try {
      await saveUserDataDB(user.uid, { startPictureUrl: img });
      setSyncError("");
    } catch (e) {
      console.error("Failed updating Day 1 picture:", e);
      setSyncError("Failed to sync Day 1 picture.");
    }
  };

  const pickCheckinPicture = async () => {
    const img = await pickImageDataUrl(false);
    if (img) {
      setCheckinPicture(img);
      setSyncError("");
    }
  };

  const toDateKey = (input: string) => format(new Date(input), "yyyy-MM-dd");

  const getWorkoutLogForDate = (dateStr: string): WorkoutLog | null => {
    if (!userData?.workoutLogs?.length) return null;
    const key = toDateKey(dateStr);
    for (let i = userData.workoutLogs.length - 1; i >= 0; i -= 1) {
      if (toDateKey(userData.workoutLogs[i].date) === key) {
        return userData.workoutLogs[i];
      }
    }
    return null;
  };

  const updateLevel = async (levelId: string) => {
    if (!user || !userData) return;
    const next = { ...userData, currentLevelId: levelId };
    setUserData(next);
    try {
      await saveUserDataDB(user.uid, { currentLevelId: levelId });
      setSyncError("");
    } catch (e) {
      console.error("Error updating level:", e);
      setSyncError("Failed to update your level.");
    }
  };

  const toggleWorkout = async (dateStr: string) => {
    if (!user || !userData) return;

    const key = toDateKey(dateStr);
    const logs = [...(userData.workoutLogs || [])];
    const idx = logs.findIndex((l) => toDateKey(l.date) === key);
    const currentLevelId = userData.currentLevelId || undefined;

    if (idx >= 0) {
      logs[idx] = {
        ...logs[idx],
        date: key,
        completed: !logs[idx].completed,
        levelCompleted: !logs[idx].completed ? currentLevelId : undefined,
      };
    } else {
      logs.push({ date: key, completed: true, levelCompleted: currentLevelId });
    }

    const next = { ...userData, workoutLogs: logs };
    setUserData(next);

    try {
      await saveUserDataDB(user.uid, { workoutLogs: logs });
      setSyncError("");
    } catch (e) {
      console.error("Error updating workout log:", e);
      setSyncError("Failed to sync workout update.");
    }
  };

  const submitMilestoneCheckin = async () => {
    if (!user || !userData) return;
    if (!checkinWeight) {
      setSyncError("Please enter your current weight for the check-in.");
      return;
    }

    const endDate = format(new Date(), "yyyy-MM-dd");
    const updates: Partial<UserData> = {
      endDate,
      endWeight: parseFloat(checkinWeight),
      endPictureUrl: checkinPicture,
    };

    const next = { ...userData, ...updates };
    setUserData(next);

    try {
      await saveUserDataDB(user.uid, updates);
      setShowCheckinModal(false);
      setCheckinWeight("");
      setCheckinPicture(null);
      setSyncError("");
    } catch (e) {
      console.error("Failed saving milestone check-in:", e);
      setSyncError("Failed to save 6-month check-in.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  // --- 1. NOT AUTHENTICATED: Show Login Screen ---
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {isLoginFlow ? "Welcome Back" : "Create Account"}
          </Text>
          <Text style={styles.subtitle}>Sync with the web app</Text>
          {authError ? (
            <Text style={{ color: "red", marginBottom: 10 }}>{authError}</Text>
          ) : null}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
          <Button
            title={isLoginFlow ? "Sign In" : "Sign Up"}
            onPress={handleAuth}
            color="#FF3366"
          />
          <TouchableOpacity
            onPress={() => setIsLoginFlow(!isLoginFlow)}
            style={{ marginTop: 15 }}
          >
            <Text style={{ textAlign: "center", color: "#00E5FF" }}>
              {isLoginFlow
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- 2. AUTHENTICATED BUT NO DATA: Show Onboarding ---
  if (!userData) {
    const accountLabel = user.email || `UID: ${user.uid}`;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>The Busy Dad Program</Text>
          <Text style={styles.subtitle}>
            It&apos;s time to begin your journey. Start with your day 1 stats.
          </Text>

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Signed in as {accountLabel}
            </Text>
            <Text style={styles.infoBannerTextMuted}>
              Your profile loads from this account.
            </Text>
          </View>

          {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Weight in lbs/kg"
            keyboardType="numeric"
          />

          <View style={styles.onboardingPhotoCard}>
            <Text style={styles.sectionLabel}>Day 1 Photo</Text>
            {day1PictureDraft ? (
              <Image
                source={{ uri: day1PictureDraft }}
                style={styles.onboardingPreviewImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.photoEmptyText}>
                Upload your starting picture.
              </Text>
            )}
            <View style={{ marginTop: 10 }}>
              <Button
                title={
                  day1PictureDraft
                    ? "Replace Day 1 Picture"
                    : "Upload Day 1 Picture"
                }
                onPress={pickDay1PictureDraft}
                color="#FF3366"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Starting Level</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
          >
            {LEVELS.map((lvl) => {
              const selected = selectedLevelId === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[
                    styles.levelPill,
                    selected && styles.levelPillSelected,
                  ]}
                  onPress={() => setSelectedLevelId(lvl.id)}
                >
                  <Text
                    style={[
                      styles.levelPillText,
                      selected && styles.levelPillTextSelected,
                    ]}
                  >
                    {lvl.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button
            title="Start Journey"
            onPress={startProgram}
            color="#FF3366"
          />
          <View style={{ marginTop: 20 }}>
            <Button
              title="Sign Out And Use A Different Account"
              onPress={handleLogout}
              color="#888"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- 3. AUTHENTICATED WITH DATA: Show Dashboard ---
  const daysPassed = Math.max(
    0,
    differenceInDays(new Date(), new Date(userData.startDate)),
  );
  const milestoneDate = addMonths(new Date(userData.startDate), 6);
  const daysToMilestone = differenceInDays(milestoneDate, new Date());
  const isMilestoneReached =
    isAfter(new Date(), milestoneDate) && !userData.endDate;
  const trackingDays = Array.from({ length: 7 })
    .map((_, i) => format(subDays(new Date(), i), "yyyy-MM-dd"))
    .reverse();
  const currentLevelObj = userData.currentLevelId
    ? LEVELS.find((l) => l.id === userData.currentLevelId)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>My Burpee Journey</Text>
            <Text style={styles.desc}>
              Day {daysPassed} • The Busy Dad Program
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

        {isMilestoneReached ? (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneTitle}>6 Month Milestone Reached</Text>
            <Text style={styles.milestoneText}>
              Time to check in and update your progress stats.
            </Text>
            <View style={{ marginTop: 10 }}>
              <Button
                title="Complete Check-In"
                onPress={() => setShowCheckinModal(true)}
                color="#FF3366"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.statsCard}>
          {currentLevelObj && (
            <Text
              style={[
                styles.statLine,
                { color: "#00E5FF", fontWeight: "bold", marginBottom: 10 },
              ]}
            >
              Current: {currentLevelObj.name}
            </Text>
          )}
          <Text style={styles.statLine}>Start Date: {userData.startDate}</Text>
          <Text style={styles.statLine}>
            Starting Weight: {userData.startWeight}
          </Text>
          {!isMilestoneReached && daysToMilestone > 0 ? (
            <Text style={[styles.statLine, { color: "#00E5FF", marginTop: 8 }]}>
              {daysToMilestone} days until 6-month check-in.
            </Text>
          ) : null}
          {userData.endDate && (
            <>
              <Text
                style={[styles.statLine, { marginTop: 10, color: "#00E5FF" }]}
              >
                Milestone: {userData.endDate}
              </Text>
              <Text style={styles.statLine}>
                New Weight: {userData.endWeight}
              </Text>
            </>
          )}
        </View>

        <Text style={[styles.header, { fontSize: 22, marginTop: 20 }]}>
          Daily Tracker
        </Text>
        <Text style={styles.desc}>
          Check off workout days (Mon, Tue, Thu, Fri)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trackerWrap}
        >
          {trackingDays.map((dateStr) => {
            const dayObj = new Date(`${dateStr}T00:00:00`);
            const dayName = format(dayObj, "EEE");
            const dayNum = format(dayObj, "d");
            const isWorkoutDay = ["Mon", "Tue", "Thu", "Fri"].includes(dayName);
            const dayLog = getWorkoutLogForDate(dateStr);
            const isDone = !!dayLog?.completed;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayChip,
                  isWorkoutDay ? styles.dayWorkout : styles.dayRest,
                  isDone && styles.dayDone,
                ]}
                disabled={!isWorkoutDay}
                onPress={() => toggleWorkout(dateStr)}
              >
                <Text style={styles.dayName}>{dayName}</Text>
                <Text style={styles.dayNum}>{dayNum}</Text>
                <Text
                  style={[styles.dayStatus, isDone && { color: "#00E5FF" }]}
                >
                  {!isWorkoutDay
                    ? "Rest"
                    : isDone
                      ? `Done ${dayLog?.levelCompleted || ""}`
                      : "Tap"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.header, { fontSize: 22, marginTop: 20 }]}>
          Progress Photos
        </Text>
        <View style={styles.photosGrid}>
          <View style={styles.photoCard}>
            <Text style={styles.photoCardTitle}>Day 1</Text>
            {userData.startPictureUrl ? (
              <Image
                source={{ uri: userData.startPictureUrl }}
                style={styles.progressImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.photoEmptyText}>
                No Day 1 picture uploaded yet.
              </Text>
            )}
            <View style={{ marginTop: 10 }}>
              <Button
                title={
                  userData.startPictureUrl
                    ? "Replace Day 1 Picture"
                    : "Upload Day 1 Picture"
                }
                onPress={replaceDay1Picture}
                color="#FF3366"
              />
            </View>
          </View>
          <View style={styles.photoCard}>
            <Text style={[styles.photoCardTitle, { color: "#00E5FF" }]}>
              6-Month Check-in
            </Text>
            {userData.endPictureUrl ? (
              <Image
                source={{ uri: userData.endPictureUrl }}
                style={styles.progressImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.photoEmptyText}>
                Your latest check-in picture will appear here after milestone
                check-in.
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.header, { fontSize: 22, marginTop: 20 }]}>
          Levels
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          {LEVELS.map((lvl) => {
            const isCurrent = userData.currentLevelId === lvl.id;
            return (
              <TouchableOpacity
                key={`level-select-${lvl.id}`}
                style={[
                  styles.levelPill,
                  isCurrent && styles.levelPillSelected,
                ]}
                onPress={() => updateLevel(lvl.id)}
              >
                <Text
                  style={[
                    styles.levelPillText,
                    isCurrent && styles.levelPillTextSelected,
                  ]}
                >
                  {lvl.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {LEVELS.map((lvl) => {
          const isCurrent = userData.currentLevelId === lvl.id;
          return (
            <View
              key={lvl.id}
              style={[
                styles.levelCard,
                isCurrent && { borderColor: "#FF3366", borderWidth: 2 },
              ]}
            >
              <Text style={styles.levelTitle}>
                {lvl.name} {isCurrent && "(Active)"}
              </Text>
              <Text style={styles.levelDesc}>{lvl.description}</Text>
            </View>
          );
        })}

        <View style={{ marginTop: 40, marginBottom: 40 }}>
          <Button title="Log Out" onPress={handleLogout} color="#444" />
        </View>
      </ScrollView>

      <Modal visible={showCheckinModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>6-Month Check-In</Text>
            <Text style={styles.modalSubtitle}>
              Update your latest weight and photo.
            </Text>

            <TextInput
              style={styles.input}
              value={checkinWeight}
              onChangeText={setCheckinWeight}
              placeholder="Current Weight in lbs/kg"
              keyboardType="numeric"
            />

            <View style={styles.onboardingPhotoCard}>
              <Text style={styles.sectionLabel}>Check-In Photo</Text>
              {checkinPicture ? (
                <Image
                  source={{ uri: checkinPicture }}
                  style={styles.onboardingPreviewImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.photoEmptyText}>
                  Upload your latest progress photo.
                </Text>
              )}
              <View style={{ marginTop: 10 }}>
                <Button
                  title={
                    checkinPicture
                      ? "Replace Check-In Picture"
                      : "Upload Check-In Picture"
                  }
                  onPress={pickCheckinPicture}
                  color="#00E5FF"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCheckinModal(false)}
                style={styles.modalSecondaryBtn}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitMilestoneCheckin}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Save Check-In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  card: {
    padding: 20,
    margin: 20,
    backgroundColor: "#141414",
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF3366",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionLabel: { color: "#aaa", marginBottom: 8, fontWeight: "600" },
  infoBanner: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: { color: "#fff", fontWeight: "600" },
  infoBannerTextMuted: { color: "#bbb", marginTop: 4 },
  errorText: { color: "#ff6b6b", marginBottom: 10 },
  header: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 5 },
  desc: { fontSize: 16, color: "#888", marginBottom: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logoutBtn: {
    borderColor: "#FF3366",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: { color: "#FF3366", fontWeight: "700", fontSize: 12 },
  milestoneCard: {
    backgroundColor: "rgba(255, 51, 102, 0.1)",
    borderColor: "#FF3366",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  milestoneTitle: {
    color: "#FF3366",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  milestoneText: { color: "#ddd" },
  statsCard: {
    backgroundColor: "#141414",
    padding: 15,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  statLine: { color: "#ddd", fontSize: 16, marginBottom: 4 },
  trackerWrap: { marginBottom: 12 },
  dayChip: {
    minWidth: 72,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  dayWorkout: { borderColor: "#333", backgroundColor: "#111" },
  dayRest: { borderColor: "#222", backgroundColor: "#0d0d0d", opacity: 0.6 },
  dayDone: { borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.08)" },
  dayName: { color: "#aaa", fontSize: 12 },
  dayNum: { color: "#fff", fontWeight: "700", fontSize: 16, marginTop: 2 },
  dayStatus: { color: "#666", fontSize: 11, marginTop: 4, textAlign: "center" },
  photosGrid: { gap: 10, marginBottom: 10 },
  photoCard: {
    backgroundColor: "#141414",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  photoCardTitle: {
    color: "#FF3366",
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 16,
  },
  progressImage: {
    width: "100%",
    height: 280,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  photoEmptyText: { color: "#888" },
  onboardingPhotoCard: {
    backgroundColor: "#111",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  onboardingPreviewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    borderColor: "#333",
    borderWidth: 1,
  },
  levelPill: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#111",
  },
  levelPillSelected: {
    borderColor: "#FF3366",
    backgroundColor: "rgba(255, 51, 102, 0.12)",
  },
  levelPillText: { color: "#aaa", fontWeight: "700" },
  levelPillTextSelected: { color: "#fff" },
  levelCard: {
    backgroundColor: "#141414",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderColor: "#333",
    borderWidth: 1,
  },
  levelTitle: {
    color: "#00E5FF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  levelDesc: { color: "#aaa", fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    color: "#FF3366",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: { color: "#bbb", marginBottom: 12 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalSecondaryBtn: {
    borderColor: "#555",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalSecondaryBtnText: { color: "#bbb", fontWeight: "700" },
  modalPrimaryBtn: {
    borderColor: "#FF3366",
    backgroundColor: "#FF3366",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalPrimaryBtnText: { color: "#fff", fontWeight: "800" },
});
