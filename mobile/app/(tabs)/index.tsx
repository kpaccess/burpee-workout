import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  differenceInDays,
  addMonths,
  isAfter,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
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
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../lib/firebase";
import { getUserData, saveUserDataDB } from "../../lib/db";
import {
  ADVANCED_LEVELS,
  BEGINNER_LEVELS,
  UserData,
  WorkoutLog,
  WorkoutTier,
} from "../../types";
import { WorkoutTimer } from "../../components/WorkoutTimer";

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Forms
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Onboarding Forms
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [day1PictureDraft, setDay1PictureDraft] = useState<string | null>(null);
  const [syncError, setSyncError] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("1B");
  const [selectedWorkoutTier, setSelectedWorkoutTier] =
    useState<WorkoutTier>("beginner");

  // Dashboard Modals
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState("");
  const [checkinPicture, setCheckinPicture] = useState<string | null>(null);

  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [selectedDateForWorkout, setSelectedDateForWorkout] = useState<
    string | null
  >(null);

  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );

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

  const openAuthForm = (mode: "login" | "signup") => {
    setIsLoginFlow(mode === "login");
    setAuthError("");
    setShowAuthForm(true);
  };

  const startProgram = async () => {
    if (!weight || !user) return;
    const isBeginnerTrack = selectedWorkoutTier === "beginner";
    const newData: UserData = {
      startDate: date,
      startWeight: parseFloat(weight),
      startPictureUrl: day1PictureDraft,
      currentLevelId: isBeginnerTrack ? "B1" : selectedLevelId,
      workoutTier: selectedWorkoutTier,
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

  const toDateKey = (input: Date | string) =>
    format(new Date(input), "yyyy-MM-dd");

  const inferWorkoutTier = (
    data: Pick<UserData, "workoutTier" | "currentLevelId">,
  ): WorkoutTier => {
    if (data.workoutTier) {
      return data.workoutTier;
    }

    return data.currentLevelId && /^B[1-6]$/.test(data.currentLevelId)
      ? "beginner"
      : "advanced";
  };

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

  const formatWorkoutLogLabel = (levelCompleted?: string): string | null => {
    if (!levelCompleted) return null;

    const beginnerMatch = levelCompleted.match(/^B([1-6])\(C\)$/);
    if (beginnerMatch) {
      return `B${beginnerMatch[1]}`;
    }

    // Backward-compatible display for older beginner logs
    if (levelCompleted === "1B(C)") {
      return "B1";
    }

    const advancedMatch = levelCompleted.match(/^([0-9A-Za-z]+)\(([NC])\)$/);
    if (advancedMatch) {
      const [, levelId, mode] = advancedMatch;
      return `${levelId}(${mode})`;
    }

    return levelCompleted;
  };

  const updateLevel = async (levelId: string) => {
    if (!user || !userData) return;
    const next = { ...userData, currentLevelId: levelId };
    setUserData(next);
    try {
      await saveUserDataDB(user.uid, { currentLevelId: levelId });
      setSyncError("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Error updating level:", e);
      setSyncError("Failed to update your level.");
    }
  };

  const handleToggleWorkout = async (
    dateStr: string,
    completed: boolean,
    type?: "N" | "C",
  ) => {
    if (!user || !userData) return;

    const key = toDateKey(dateStr);
    const logs = [...(userData.workoutLogs || [])];
    const idx = logs.findIndex((l) => toDateKey(l.date) === key);
    const workoutTier = inferWorkoutTier(userData);
    const isBeginnerTrack = workoutTier === "beginner";
    const effectiveType = isBeginnerTrack ? "C" : type;
    const typeSuffix = effectiveType ? `(${effectiveType})` : "";
    const beginnerLevelId =
      isBeginnerTrack &&
      typeof userData.currentLevelId === "string" &&
      /^B[1-6]$/.test(userData.currentLevelId)
        ? userData.currentLevelId
        : "B1";
    const levelCompleted = completed
      ? isBeginnerTrack
        ? `${beginnerLevelId}(C)`
        : `${userData.currentLevelId || ""}${typeSuffix}`
      : undefined;
    const workoutType =
      effectiveType === "N"
        ? "with_pushups"
        : effectiveType === "C"
          ? "no_pushups"
          : undefined;

    if (idx >= 0) {
      if (!completed) {
        // Remove or mark uncompleted
        logs[idx] = {
          ...logs[idx],
          completed: false,
          levelCompleted: undefined,
          workoutType: undefined,
        };
      } else {
        logs[idx] = {
          ...logs[idx],
          completed: true,
          levelCompleted,
          workoutType,
        };
      }
    } else if (completed) {
      logs.push({
        date: key,
        completed: true,
        levelCompleted,
        workoutType,
      });
    }

    const next = { ...userData, workoutLogs: logs };
    setUserData(next);

    try {
      await saveUserDataDB(user.uid, { workoutLogs: logs });
      setSyncError("");
      if (completed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    if (!showAuthForm) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.landingScrollContent}>
            <View style={styles.landingHero}>
              <View style={styles.landingBadge}>
                <Ionicons name="barbell-outline" size={16} color="#fff" />
                <Text style={styles.landingBadgeText}>BurpeePacer</Text>
              </View>

              <Text style={styles.landingTitle}>
                Burpees: Simple, Brutal, and Proven
              </Text>
              <Text style={styles.landingSubtitle}>
                Start with free access, follow the schedule, and build progress
                with a clear beginner or advanced track.
              </Text>

              <View style={styles.attributionBox}>
                <Text style={styles.attributionTitle}>
                  Inspired by the Busy Dad Program by Busy Dad Training.
                </Text>
                <Text style={styles.attributionText}>
                  This app is an independent project and is not affiliated with
                  or endorsed by Busy Dad Training.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => openAuthForm("signup")}
              >
                <Text style={styles.primaryActionBtnText}>
                  Start 60-Day Free Access
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryActionBtn, styles.landingSecondaryBtn]}
                onPress={() =>
                  Linking.openURL("https://burpeepacer.com/pricing")
                }
              >
                <Text style={styles.secondaryActionBtnText}>
                  See Advanced Pricing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openAuthForm("login")}
                style={styles.landingTextAction}
              >
                <Text style={styles.landingTextActionLabel}>
                  Already a member? Sign in
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.landingInfoCard}>
              <Text style={styles.landingInfoTitle}>Why Burpees Work</Text>
              <Text style={styles.landingInfoText}>
                Burpees train legs, core, chest, shoulders, and lungs in one
                short session with no equipment.
              </Text>
              <Text style={styles.landingInfoText}>
                The real advantage is consistency. Training at home removes the
                friction that breaks routines.
              </Text>
            </View>

            <View style={styles.landingInfoCard}>
              <Text style={styles.landingInfoTitle}>Weekly Rhythm</Text>
              <Text style={styles.landingInfoText}>
                A simple example schedule is Mon, Tue, Thu, Fri for training,
                with recovery on the other days.
              </Text>
              <Text style={styles.landingInfoText}>
                Stay on schedule and the results compound.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => {
                setShowAuthForm(false);
                setAuthError("");
              }}
              style={styles.authBackBtn}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={styles.authBackBtnText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {isLoginFlow ? "Welcome Back" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>Sync with the web app</Text>
            {authError ? (
              <Text
                style={{
                  color: "#ff6b6b",
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {authError}
              </Text>
            ) : null}
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleAuth}
            >
              <Text style={styles.primaryActionBtnText}>
                {isLoginFlow ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLoginFlow(!isLoginFlow)}
              style={{ marginTop: 20 }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#00E5FF",
                  fontWeight: "600",
                }}
              >
                {isLoginFlow
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- 2. AUTHENTICATED BUT NO DATA: Show Onboarding ---
  if (!userData) {
    const accountLabel = user.email || `UID: ${user.uid}`;
    const isBeginnerTrack = selectedWorkoutTier === "beginner";

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.card}>
            <Text style={styles.title}>The Busy Dad Program</Text>
            <Text style={styles.subtitle}>
              It&apos;s time to begin your journey. Start with your day 1 stats.
            </Text>

            <View style={styles.attributionBox}>
              <Text style={styles.attributionTitle}>
                Inspired by the Busy Dad Program by Busy Dad Training.
              </Text>
              <Text style={styles.attributionText}>
                This app is an independent project and is not affiliated with or
                endorsed by Busy Dad Training.
              </Text>
            </View>

            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Signed in as {accountLabel}
              </Text>
              <Text style={styles.infoBannerTextMuted}>
                Your profile loads from this account.
              </Text>
            </View>

            {syncError ? (
              <Text style={styles.errorText}>{syncError}</Text>
            ) : null}

            <Text style={styles.sectionLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />

            <Text style={styles.sectionLabel}>Starting Weight</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight in lbs/kg"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <Text style={styles.sectionLabel}>Workout Type</Text>
            <View style={styles.tierRow}>
              {[
                {
                  key: "beginner" as const,
                  label: "Beginner",
                  description: "Free single-session timer",
                },
                {
                  key: "advanced" as const,
                  label: "Advanced",
                  description: "Paid paced rep timer",
                },
              ].map((entry) => {
                const isSelected = selectedWorkoutTier === entry.key;
                return (
                  <TouchableOpacity
                    key={entry.key}
                    style={[
                      styles.tierCard,
                      isSelected && styles.tierCardSelected,
                    ]}
                    onPress={() => setSelectedWorkoutTier(entry.key)}
                  >
                    <Text
                      style={[
                        styles.tierTitle,
                        isSelected && styles.tierTitleSelected,
                      ]}
                    >
                      {entry.label}
                    </Text>
                    <Text style={styles.tierDescription}>
                      {entry.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.onboardingPhotoCard}>
              <Text style={styles.sectionLabel}>Day 1 Photo</Text>
              {day1PictureDraft ? (
                <Image
                  source={{ uri: day1PictureDraft }}
                  style={styles.onboardingPreviewImage}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.onboardingPreviewImage,
                    {
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#000",
                    },
                  ]}
                >
                  <Ionicons name="image-outline" size={48} color="#333" />
                  <Text style={styles.photoEmptyText}>
                    Upload your starting picture.
                  </Text>
                </View>
              )}
              <View style={{ marginTop: 10 }}>
                <Button
                  title={day1PictureDraft ? "Replace Photo" : "Upload Photo"}
                  onPress={pickDay1PictureDraft}
                  color="#FF3366"
                />
              </View>
            </View>

            {isBeginnerTrack ? (
              <View style={styles.beginnerHintBox}>
                <Text style={styles.beginnerHintText}>
                  Beginner uses one built-in session, so level selection is
                  hidden.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Starting Level</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                >
                  {ADVANCED_LEVELS.map((lvl) => {
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
              </>
            )}

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={startProgram}
            >
              <Text style={styles.primaryActionBtnText}>Start Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={handleLogout}>
              <Text style={{ textAlign: "center", color: "#888" }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  const workoutTier = inferWorkoutTier(userData);
  const isAdvancedTrack = workoutTier === "advanced";
  const isBeginnerTrack = !isAdvancedTrack;
  const levelsForTrack = isAdvancedTrack ? ADVANCED_LEVELS : BEGINNER_LEVELS;

  // --- 3. AUTHENTICATED WITH DATA: Show Dashboard ---
  const startDate = new Date(userData.startDate);
  const daysPassed = Math.max(0, differenceInDays(new Date(), startDate));
  const milestoneDate = addMonths(startDate, 6);
  const daysToMilestone = differenceInDays(milestoneDate, new Date());
  const isMilestoneReached =
    isAfter(new Date(), milestoneDate) && !userData.endDate;

  const currentLevelObj = userData.currentLevelId
    ? levelsForTrack.find((l) => l.id === userData.currentLevelId)
    : null;

  // Generate Calendar Data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
            <TouchableOpacity
              style={[styles.primaryActionBtn, { marginTop: 12, height: 40 }]}
              onPress={() => setShowCheckinModal(true)}
            >
              <Text style={styles.primaryActionBtnText}>Complete Check-In</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="body-outline"
                size={20}
                color="#00E5FF"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                Overview
              </Text>
            </View>
            {currentLevelObj && (
              <View style={styles.currentLevelBadge}>
                <Text style={styles.currentLevelBadgeText}>
                  {currentLevelObj.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Start Date</Text>
              <Text style={styles.statValue}>
                {format(startDate, "MMM d, yyyy")}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Start Weight</Text>
              <Text style={styles.statValue}>
                {userData.startWeight}{" "}
                <Text style={{ fontSize: 12 }}>kg/lbs</Text>
              </Text>
            </View>
          </View>

          {currentLevelObj && (
            <View style={[styles.milestoneCountdown, { marginTop: 15 }]}>
              <Ionicons
                name="flag-outline"
                size={16}
                color="#00E5FF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.milestoneCountdownText}>
                Current level: {currentLevelObj.name}
              </Text>
            </View>
          )}

          <View style={[styles.milestoneCountdown, { marginTop: 15 }]}>
            <Ionicons
              name={
                isBeginnerTrack ? "checkmark-circle-outline" : "flash-outline"
              }
              size={16}
              color="#00E5FF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.milestoneCountdownText}>
              {isBeginnerTrack
                ? "Beginner single-session timer active"
                : "Advanced paced timer active"}
            </Text>
          </View>

          {!isMilestoneReached && daysToMilestone > 0 && (
            <View style={styles.milestoneCountdown}>
              <Ionicons
                name="time-outline"
                size={16}
                color="#00E5FF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.milestoneCountdownText}>
                {daysToMilestone} days until 6-month check-in
              </Text>
            </View>
          )}
        </View>

        {/* Workout Timer Section */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Session Timer</Text>
          <WorkoutTimer
            tier={workoutTier}
            sealsGoal={currentLevelObj?.seals}
            sixCountsGoal={currentLevelObj?.sixCounts}
            onFinish={() => {
              const todayKey = toDateKey(new Date());
              if (isBeginnerTrack) {
                handleToggleWorkout(todayKey, true, "C");
              } else {
                setSelectedDateForWorkout(todayKey);
                setWorkoutModalVisible(true);
              }
            }}
          />
        </View>

        {/* Calendar Section */}
        <View style={{ marginTop: 24 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Workout Calendar</Text>
            <View style={styles.calendarNav}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthName}>
                {format(currentMonth, "MMMM yyyy")}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calendarGrid}>
            {/* Week Header */}
            <View style={styles.calendarRow}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.calendarWeekText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calendarDaysContainer}>
              {calendarDays.map((day, idx) => {
                const dateStr = toDateKey(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const dayName = format(day, "EEE");
                const isWorkoutDay = ["Mon", "Tue", "Thu", "Fri"].includes(
                  dayName,
                );
                const dayLog = getWorkoutLogForDate(dateStr);
                const isDone = !!dayLog?.completed;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      styles.calendarDay,
                      !isCurrentMonth && { opacity: 0.2 },
                      isToday && styles.calendarToday,
                      isDone && styles.calendarDayDone,
                      !isDone &&
                        isWorkoutDay &&
                        isCurrentMonth &&
                        styles.calendarDayActive,
                    ]}
                    onPress={() => {
                      if (!isWorkoutDay) return;
                      if (isDone) {
                        handleToggleWorkout(dateStr, false);
                      } else if (isBeginnerTrack) {
                        handleToggleWorkout(dateStr, true, "C");
                      } else {
                        setSelectedDateForWorkout(dateStr);
                        setWorkoutModalVisible(true);
                      }
                    }}
                    disabled={!isCurrentMonth && !isWorkoutDay}
                  >
                    <Text
                      style={[
                        styles.calendarDayNum,
                        isDone && { color: "#fff" },
                      ]}
                    >
                      {format(day, "d")}
                    </Text>
                    {isDone && (
                      <View style={styles.calendarDoneMarker}>
                        <Text style={styles.calendarDoneType}>
                          {formatWorkoutLogLabel(dayLog?.levelCompleted) || "W"}
                        </Text>
                      </View>
                    )}
                    {!isDone && isWorkoutDay && isCurrentMonth && (
                      <View style={styles.calendarRestMarker} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text style={styles.calendarLegend}>
            Scheduled days: Mon, Tue, Thu, Fri
          </Text>
        </View>

        {/* Video Tutorials */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Tutorials & Intro</Text>
          <View style={styles.videoRow}>
            <TouchableOpacity
              style={styles.videoCard}
              onPress={() =>
                Linking.openURL(
                  "https://www.youtube.com/watch?v=3Yooen5zgCg&list=PLhE7BYqSXmSEuE2qoJE9w3rLEzuenuoLq&index=1",
                )
              }
            >
              <Ionicons name="play-circle" size={32} color="#FF3366" />
              <Text style={styles.videoCardText}>Program Intro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.videoCard}
              onPress={() =>
                Linking.openURL(
                  "https://www.youtube.com/playlist?list=PLhE7BYqSXmSEJFzla9_j34HEmLdEsOrvF",
                )
              }
            >
              <Ionicons name="videocam" size={32} color="#00E5FF" />
              <Text style={styles.videoCardText}>Forms & Levels</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Photos */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
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
              <View
                style={[
                  styles.progressImage,
                  { justifyContent: "center", alignItems: "center" },
                ]}
              >
                <Ionicons name="camera-outline" size={40} color="#333" />
                <Text style={styles.photoEmptyText}>No photo yet</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { marginTop: 10 }]}
              onPress={replaceDay1Picture}
            >
              <Text style={styles.secondaryActionBtnText}>Replace Photo</Text>
            </TouchableOpacity>
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
              <View
                style={[
                  styles.progressImage,
                  { justifyContent: "center", alignItems: "center" },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={40} color="#222" />
                <Text
                  style={[
                    styles.photoEmptyText,
                    { textAlign: "center", padding: 10 },
                  ]}
                >
                  Unlock after check-in
                </Text>
              </View>
            )}
          </View>
        </View>

        {currentLevelObj && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.sectionTitle}>Current Level</Text>
            <View style={styles.levelCard}>
              <Text style={styles.levelTitle}>
                {currentLevelObj.name} (Active)
              </Text>
              <Text style={styles.levelDesc}>
                {currentLevelObj.description}
              </Text>
            </View>
          </View>
        )}

        <>
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>My Level</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {levelsForTrack.map((lvl) => {
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
        </>

        <TouchableOpacity
          style={[
            styles.secondaryActionBtn,
            { marginTop: 40, marginBottom: 60 },
          ]}
          onPress={handleLogout}
        >
          <Text style={[styles.secondaryActionBtnText, { color: "#888" }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {isAdvancedTrack && (
        <Modal
          visible={workoutModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setWorkoutModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setWorkoutModalVisible(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Workout Type</Text>
              <Text style={styles.modalSubtitle}>How did you move today?</Text>

              <TouchableOpacity
                style={styles.workoutOptionBtn}
                onPress={() => {
                  if (selectedDateForWorkout)
                    handleToggleWorkout(selectedDateForWorkout, true, "N");
                  setWorkoutModalVisible(false);
                }}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    { backgroundColor: "rgba(255, 51, 102, 0.1)" },
                  ]}
                >
                  <Text
                    style={{
                      color: "#FF3366",
                      fontWeight: "900",
                      fontSize: 18,
                    }}
                  >
                    N
                  </Text>
                </View>
                <View>
                  <Text style={styles.optionTitle}>Navy Seals</Text>
                  <Text style={styles.optionDesc}>Full range burpees</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workoutOptionBtn}
                onPress={() => {
                  if (selectedDateForWorkout)
                    handleToggleWorkout(selectedDateForWorkout, true, "C");
                  setWorkoutModalVisible(false);
                }}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    { backgroundColor: "rgba(0, 229, 255, 0.1)" },
                  ]}
                >
                  <Text
                    style={{
                      color: "#00E5FF",
                      fontWeight: "900",
                      fontSize: 18,
                    }}
                  >
                    C
                  </Text>
                </View>
                <View>
                  <Text style={styles.optionTitle}>6-Counts</Text>
                  <Text style={styles.optionDesc}>Strict 6-count burpees</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSecondaryBtn,
                  {
                    marginTop: 10,
                    alignSelf: "center",
                    borderWidth: 0,
                    paddingHorizontal: 30,
                  },
                ]}
                onPress={() => setWorkoutModalVisible(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Milestone Checkin Modal */}
      <Modal visible={showCheckinModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView
            contentContainerStyle={{
              justifyContent: "center",
              flexGrow: 1,
              padding: 20,
            }}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>6-Month Check-In</Text>
              <Text style={styles.modalSubtitle}>
                Update your latest weight and photo.
              </Text>

              <Text style={styles.sectionLabel}>Current Weight</Text>
              <TextInput
                style={styles.input}
                value={checkinWeight}
                onChangeText={setCheckinWeight}
                placeholder="Current Weight in lbs/kg"
                placeholderTextColor="#666"
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
                  <View
                    style={[
                      styles.onboardingPreviewImage,
                      {
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#000",
                      },
                    ]}
                  >
                    <Ionicons name="camera" size={32} color="#333" />
                  </View>
                )}
                <View style={{ marginTop: 10 }}>
                  <Button
                    title={checkinPicture ? "Replace Photo" : "Upload Photo"}
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
          </ScrollView>
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
    backgroundColor: "#060606",
  },
  container: { flex: 1, backgroundColor: "#060606" },
  landingScrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  landingHero: {
    paddingTop: 16,
    marginBottom: 24,
  },
  landingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
  },
  landingBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  landingTitle: {
    color: "#fff",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  landingSubtitle: {
    color: "#bbb",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  landingSecondaryBtn: {
    marginTop: 12,
  },
  landingTextAction: {
    marginTop: 18,
    alignItems: "center",
  },
  landingTextActionLabel: {
    color: "#00E5FF",
    fontWeight: "700",
    fontSize: 14,
  },
  landingInfoCard: {
    backgroundColor: "#111",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },
  landingInfoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  landingInfoText: {
    color: "#999",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  card: {
    padding: 24,
    margin: 4,
    backgroundColor: "#111",
    borderRadius: 24,
    borderColor: "#222",
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FF3366",
    marginBottom: 8,
    textAlign: "center",
  },
  authBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 18,
    gap: 4,
  },
  authBackBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: "#222",
    borderWidth: 1,
  },
  sectionLabel: {
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 13,
    textTransform: "uppercase",
  },
  infoBanner: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoBannerText: { color: "#fff", fontWeight: "600" },
  infoBannerTextMuted: { color: "#666", marginTop: 4, fontSize: 12 },
  errorText: { color: "#ff6b6b", marginBottom: 10, textAlign: "center" },
  header: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  desc: { fontSize: 16, color: "#666", marginBottom: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logoutBtn: {
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#111",
  },
  logoutText: { color: "#888", fontWeight: "700", fontSize: 13 },
  milestoneCard: {
    backgroundColor: "rgba(255, 51, 102, 0.1)",
    borderColor: "#FF3366",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  milestoneTitle: {
    color: "#FF3366",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 6,
  },
  milestoneText: { color: "#ccc", lineHeight: 20 },
  statsCard: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 24,
    borderColor: "#222",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  currentLevelBadge: {
    backgroundColor: "rgba(255, 51, 102, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderColor: "rgba(255, 51, 102, 0.3)",
    borderWidth: 1,
  },
  currentLevelBadgeText: {
    color: "#FF3366",
    fontWeight: "800",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: "#555",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  milestoneCountdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 229, 255, 0.05)",
    padding: 10,
    borderRadius: 12,
    marginTop: 15,
  },
  milestoneCountdownText: {
    color: "#00E5FF",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  calendarMonthName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    minWidth: 100,
    textAlign: "center",
  },
  calendarGrid: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 12,
    borderColor: "#222",
    borderWidth: 1,
  },
  calendarRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarWeekText: {
    flex: 1,
    textAlign: "center",
    color: "#555",
    fontSize: 12,
    fontWeight: "700",
  },
  calendarDaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 4,
    position: "relative",
  },
  calendarToday: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  calendarDayActive: {
    borderColor: "#333",
    borderWidth: 1,
  },
  calendarDayDone: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderColor: "#00E5FF",
    borderWidth: 1,
  },
  calendarDayNum: {
    color: "#666",
    fontWeight: "700",
    fontSize: 14,
  },
  calendarDoneMarker: {
    position: "absolute",
    bottom: 2,
    backgroundColor: "#00E5FF",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  calendarDoneType: {
    color: "#000",
    fontSize: 8,
    fontWeight: "900",
  },
  calendarRestMarker: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    marginTop: 2,
  },
  calendarLegend: {
    color: "#555",
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
  },
  videoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  videoCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderColor: "#222",
    borderWidth: 1,
  },
  videoCardText: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 8,
    fontSize: 13,
  },
  photosGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  photoCard: {
    flex: 1,
    backgroundColor: "#111",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  photoCardTitle: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 12,
    fontSize: 15,
  },
  progressImage: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: 16,
    backgroundColor: "#000",
    borderColor: "#222",
    borderWidth: 1,
  },
  photoEmptyText: { color: "#444", fontSize: 12, marginTop: 4 },
  onboardingPhotoCard: {
    backgroundColor: "#000",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  attributionBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  attributionTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 18,
  },
  attributionText: {
    color: "#888",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  onboardingPreviewImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    borderColor: "#222",
    borderWidth: 1,
  },
  tierRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  tierCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#111",
  },
  tierCardSelected: {
    borderColor: "#00E5FF",
    backgroundColor: "rgba(0, 229, 255, 0.08)",
  },
  tierTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 4,
  },
  tierTitleSelected: {
    color: "#00E5FF",
  },
  tierDescription: {
    color: "#888",
    fontSize: 12,
    lineHeight: 18,
  },
  beginnerHintBox: {
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    borderColor: "#1d4d4d",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  beginnerHintText: {
    color: "#c6f7ff",
    fontSize: 13,
    lineHeight: 20,
  },
  levelPill: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: "#111",
  },
  levelPillSelected: {
    borderColor: "#FF3366",
    backgroundColor: "rgba(255, 51, 102, 0.1)",
  },
  levelPillText: { color: "#666", fontWeight: "700" },
  levelPillTextSelected: { color: "#fff" },
  levelCard: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 20,
    marginTop: 12,
    borderColor: "#222",
    borderWidth: 1,
  },
  levelTitle: {
    color: "#00E5FF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  levelDesc: { color: "#888", fontSize: 14, lineHeight: 20 },
  primaryActionBtn: {
    backgroundColor: "#FF3366",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  primaryActionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryActionBtn: {
    borderColor: "#222",
    borderWidth: 1,
    backgroundColor: "#111",
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryActionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#111",
    borderRadius: 32,
    borderColor: "#333",
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: { color: "#888", marginBottom: 24, textAlign: "center" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderColor: "#222",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSecondaryBtnText: { color: "#888", fontWeight: "700" },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: "#FF3366",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalPrimaryBtnText: { color: "#fff", fontWeight: "800" },
  workoutOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderColor: "#222",
    borderWidth: 1,
  },
  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  optionDesc: {
    color: "#666",
    fontSize: 13,
  },
});
