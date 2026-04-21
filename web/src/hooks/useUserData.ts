import { useState, useEffect } from "react";
import { UserData, WorkoutLog } from "../types";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserDataDB } from "../lib/db";
import { toDateKey } from "../lib/date";

type PersistedWorkoutLog = WorkoutLog & {
  workoutType?: "with_pushups" | "no_pushups";
};

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null | undefined>(
    undefined,
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFirebaseData() {
      if (!user) {
        setUserData(null);
        setSyncError(null);
        return;
      }

      // Mark as loading for authenticated users while Firestore fetch runs.
      setUserData(undefined);

      try {
        const data = await getUserData(user.uid);
        if (mounted) {
          setUserData(data || null);
          setSyncError(null);
        }
      } catch (err) {
        console.error("Failed to load user data from Firebase", err);
        if (mounted) {
          // Keep undefined so UI doesn't look like a first-time user.
          setUserData(undefined);
          setSyncError("Failed to load your data from Firebase.");
        }
      }
    }

    loadFirebaseData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const saveUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    const isFirstSave = !userData; // userData is null before first onboarding
    const baseData = (userData ?? {}) as Partial<UserData>;
    const newData = { ...baseData, ...data } as UserData;
    setUserData(newData); // Optimistic UI update
    try {
      await saveUserDataDB(user.uid, newData);
      setSyncError(null);
      // Send welcome email only on the very first onboarding save
      if (isFirstSave && user.email) {
        fetch("/api/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, email: user.email }),
        }).catch(() => {
          // Non-critical — don't block the user if email fails
        });
      }
    } catch (err) {
      console.error("Failed to save user data to Firebase", err);
      setSyncError(
        "Failed to sync data. Please check your login and try again.",
      );
      throw err;
    }
  };

  const toggleWorkoutLog = async (
    dateStr: string,
    completed: boolean,
    type?: "N" | "C",
  ) => {
    if (!user || !userData) return;
    const normalizedDate = toDateKey(dateStr);
    const inferredTier =
      userData.currentLevelId && /^B[1-6]$/.test(userData.currentLevelId)
        ? "beginner"
        : "advanced";
    const effectiveTier = userData.workoutTier ?? inferredTier;
    const isBeginnerTrack = effectiveTier === "beginner";

    // Create a deeper copy of logs to avoid read-only mutation issues
    const logs = [...(userData.workoutLogs || [])].map((log) => ({ ...log }));
    const idx = logs.findIndex((l) => toDateKey(l.date) === normalizedDate);
    const beginnerLevelId =
      isBeginnerTrack &&
      typeof userData.currentLevelId === "string" &&
      /^B[1-6]$/.test(userData.currentLevelId)
        ? userData.currentLevelId
        : "B1";
    const effectiveType = isBeginnerTrack ? "C" : type;
    const typeSuffix = effectiveType ? `(${effectiveType})` : "";
    const levelCompleted = completed
      ? isBeginnerTrack
        ? `${beginnerLevelId}(C)`
        : `${userData.currentLevelId || ""}${typeSuffix}`
      : null;
    const workoutType =
      effectiveType === "N"
        ? "with_pushups"
        : effectiveType === "C"
          ? "no_pushups"
          : undefined;

    if (idx >= 0) {
      logs[idx].completed = completed;
      logs[idx].date = normalizedDate;
      if (levelCompleted) {
        logs[idx].levelCompleted = levelCompleted;
      } else {
        delete logs[idx].levelCompleted; // Remove field to prevent undefined/null Firestore complaints
      }
      if (workoutType) {
        (logs[idx] as PersistedWorkoutLog).workoutType = workoutType;
      } else {
        delete (logs[idx] as PersistedWorkoutLog).workoutType;
      }
    } else {
      const newLog: PersistedWorkoutLog = { date: normalizedDate, completed };
      if (levelCompleted) newLog.levelCompleted = levelCompleted;
      if (workoutType) newLog.workoutType = workoutType;
      logs.push(newLog);
    }

    // Clean array from any undefined fields just in case
    const safeLogs: PersistedWorkoutLog[] = logs.map((log) => ({
      date: log.date,
      completed: log.completed,
      ...(log.levelCompleted ? { levelCompleted: log.levelCompleted } : {}),
      ...(log.workoutType ? { workoutType: log.workoutType } : {}),
      ...(log.notes ? { notes: log.notes } : {}),
    }));

    try {
      await saveUserData({ workoutLogs: safeLogs });
    } catch (e) {
      console.warn("Handled save error:", e);
    }
  };

  const clearUserData = () => {
    setUserData(null);
    // Real implementation would delete from DB here or let the AuthContext handle logout
  };

  const isLoaded = !user || userData !== undefined || !!syncError;

  return {
    userData,
    isLoaded,
    saveUserData,
    clearUserData,
    toggleWorkoutLog,
    syncError,
  };
}
