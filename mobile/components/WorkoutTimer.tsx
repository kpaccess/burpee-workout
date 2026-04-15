import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import {
  buildWorkoutTimerConfig,
  formatWorkoutTimerTime,
} from "../lib/workoutTimer";
import { useWorkoutTimer } from "../hooks/useWorkoutTimer";
import { WorkoutTier } from "../types";

interface WorkoutTimerProps {
  tier?: WorkoutTier;
  initialMinutes?: number;
  onFinish?: () => void;
  sealsGoal?: number;
  sixCountsGoal?: number;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  tier = "advanced",
  initialMinutes = 20,
  onFinish,
  sealsGoal = 0,
  sixCountsGoal = 0,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const beepPlayer = useAudioPlayer(
    "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    {
      downloadFirst: true,
      keepAudioSessionActive: true,
    },
  );
  const timerConfig = useMemo(
    () =>
      buildWorkoutTimerConfig({
        tier,
        initialMinutes,
        sealsGoal,
        sixCountsGoal,
      }),
    [initialMinutes, sealsGoal, sixCountsGoal, tier],
  );
  const {
    activeMode,
    modes,
    secondsLeft,
    isActive,
    currentRep,
    secondsToNextRep,
    toggleTimer,
    resetTimer,
    selectMode,
  } = useWorkoutTimer({
    config: timerConfig,
    onFinish: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onFinish?.();
    },
    onRepBoundary: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      playBeep();
    },
  });

  useEffect(() => {
    beepPlayer.volume = 1;
  }, [beepPlayer]);

  const playBeep = async () => {
    try {
      await beepPlayer.seekTo(0);
      beepPlayer.play();
    } catch (e) {
      console.log("Error playing beep", e);
    }
  };

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  return (
    <View style={styles.container}>
      {modes.length > 1 ? (
        <View style={styles.modeToggle}>
          {modes.map((entry) => (
            <TouchableOpacity
              key={entry.mode}
              style={[
                styles.modeBtn,
                activeMode.mode === entry.mode && styles.modeBtnActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                selectMode(entry.mode);
              }}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  activeMode.mode === entry.mode && styles.modeBtnTextActive,
                ]}
              >
                {entry.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.singleModeWrap}>
          <Text style={styles.singleModeTitle}>{activeMode.label}</Text>
          <Text style={styles.singleModeSubtitle}>
            {activeMode.description}
          </Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.timerCircle,
          { transform: [{ scale: pulseAnim }] },
          isActive && styles.activeTimerCircle,
        ]}
      >
        <Text style={styles.timeText}>
          {formatWorkoutTimerTime(secondsLeft)}
        </Text>

        {activeMode.goal > 0 ? (
          <View style={styles.pacerInfo}>
            <Text style={styles.repCount}>
              REP {currentRep} / {activeMode.goal}
            </Text>
            {isActive && secondsToNextRep !== null && (
              <Text style={styles.nextRepText}>
                Next in {secondsToNextRep}s
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.label}>1 rep every minute</Text>
        )}
      </Animated.View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            resetTimer();
          }}
        >
          <Ionicons name="refresh" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, isActive ? styles.pauseBtn : null]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleTimer();
          }}
        >
          <Ionicons
            name={isActive ? "pause" : "play"}
            size={32}
            color="#fff"
            style={{ marginLeft: isActive ? 0 : 4 }}
          />
        </TouchableOpacity>

        <View style={styles.controlBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  singleModeWrap: {
    marginBottom: 24,
    alignItems: "center",
  },
  singleModeTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  singleModeSubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 4,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 25,
    padding: 4,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#222",
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeBtnActive: {
    backgroundColor: "#333",
  },
  modeBtnText: {
    color: "#666",
    fontWeight: "700",
    fontSize: 13,
  },
  modeBtnTextActive: {
    color: "#00E5FF",
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderColor: "#1a1a1a",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  activeTimerCircle: {
    borderColor: "#FF3366",
    shadowColor: "#FF3366",
    shadowOpacity: 0.2,
  },
  timeText: {
    fontSize: 60,
    fontWeight: "900",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  pacerInfo: {
    marginTop: 10,
    alignItems: "center",
  },
  repCount: {
    color: "#00E5FF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  nextRepText: {
    color: "#FF3366",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    gap: 20,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pauseBtn: {
    backgroundColor: "#333",
    shadowColor: "#000",
  },
});
