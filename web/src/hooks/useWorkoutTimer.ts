import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  WorkoutMode,
  WorkoutTimerConfig,
  WorkoutTimerModeConfig,
} from "../../../shared/workoutTimer";
import {
  playCountdownTick,
  playGoBeep,
  playRepBeep,
  playFinishBeep,
  playFinishWhistle,
  playPrepareWarningBeep,
  playRepWarningBeep,
  playWhistle,
} from "../lib/sounds";

const PREPARE_SECONDS = 10;
const REP_EPSILON = 1e-9;

type TimerPhase = "idle" | "prepare" | "workout" | "done";

interface UseWorkoutTimerOptions {
  config: WorkoutTimerConfig;
  onFinish?: () => void;
  onRepBoundary?: (rep: number, mode: WorkoutMode) => void;
}

export function useWorkoutTimer({
  config,
  onFinish,
  onRepBoundary,
}: UseWorkoutTimerOptions) {
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>(
    config.defaultMode,
  );
  const [secondsLeft, setSecondsLeft] = useState(config.initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [prepareSecondsLeft, setPrepareSecondsLeft] = useState(PREPARE_SECONDS);

  const onFinishRef = useRef(onFinish);
  const onRepBoundaryRef = useRef(onRepBoundary);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onRepBoundaryRef.current = onRepBoundary;
  }, [onFinish, onRepBoundary]);

  const totalSeconds = config.initialMinutes * 60;
  const mode = config.modes.some((entry) => entry.mode === selectedMode)
    ? selectedMode
    : config.defaultMode;

  const activeMode: WorkoutTimerModeConfig = useMemo(() => {
    return config.modes.find((entry) => entry.mode === mode) ?? config.modes[0];
  }, [config.modes, mode]);

  const intervalSeconds =
    activeMode.goal > 0 ? totalSeconds / activeMode.goal : 0;
  const secondsDone = totalSeconds - secondsLeft;
  const repsCompleted =
    intervalSeconds > 0
      ? Math.min(
          activeMode.goal,
          Math.floor(secondsDone / intervalSeconds + REP_EPSILON),
        )
      : 0;
  const secondsToNextRep =
    intervalSeconds > 0 && repsCompleted < activeMode.goal
      ? Math.max(
          0,
          Math.ceil((repsCompleted + 1) * intervalSeconds - secondsDone),
        )
      : null;

  // ── Prepare countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "prepare") return;

    if (prepareSecondsLeft <= 0) {
      // Prepare done → GO!
      playWhistle();
      setPhase("workout");
      setIsActive(true);
      return;
    }

    const timerId = setInterval(() => {
      setPrepareSecondsLeft((prev) => {
        const next = prev - 1;
        if (next > 0) {
          if (next <= 3) {
            playPrepareWarningBeep();
          } else {
            playCountdownTick();
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, prepareSecondsLeft]);

  // ── Workout countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || secondsLeft <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((previousValue) => {
        const nextValue = previousValue - 1;
        const clampedNextValue = nextValue < 0 ? 0 : nextValue;
        const previousTimeElapsed = totalSeconds - previousValue;
        const timeElapsed = totalSeconds - clampedNextValue;

        if (intervalSeconds > 0) {
          const previousRep = Math.min(
            activeMode.goal,
            Math.floor(previousTimeElapsed / intervalSeconds + REP_EPSILON),
          );
          const rep = Math.min(
            activeMode.goal,
            Math.floor(timeElapsed / intervalSeconds + REP_EPSILON),
          );

          // Compute seconds until next rep boundary
          const nextSecondsDone = totalSeconds - clampedNextValue;
          const nextRepsCompleted = Math.min(
            activeMode.goal,
            Math.floor(nextSecondsDone / intervalSeconds + REP_EPSILON),
          );
          const secondsUntilBoundary =
            nextRepsCompleted < activeMode.goal
              ? Math.max(
                  0,
                  Math.ceil(
                    (nextRepsCompleted + 1) * intervalSeconds - nextSecondsDone,
                  ),
                )
              : null;

          // Warning beeps 4–1 seconds before rep boundary
          if (
            secondsUntilBoundary !== null &&
            secondsUntilBoundary >= 1 &&
            secondsUntilBoundary <= 4
          ) {
            playRepWarningBeep();
          }

          if (rep > previousRep) {
            setCurrentRep(rep);
            playWhistle();
            onRepBoundaryRef.current?.(rep, activeMode.mode);
          }
        }

        if (clampedNextValue === 0) {
          setIsActive(false);
          setPhase("done");
          playFinishWhistle();
          onFinishRef.current?.();
        }

        return clampedNextValue;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeMode.mode, intervalSeconds, isActive, secondsLeft, totalSeconds]);

  const resetTimer = () => {
    setIsActive(false);
    setPhase("idle");
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
    setPrepareSecondsLeft(PREPARE_SECONDS);
  };

  const toggleTimer = useCallback(() => {
    if (phase === "idle" || phase === "done") {
      // Fresh start → kick off prepare countdown
      setSecondsLeft(totalSeconds);
      setCurrentRep(0);
      setPrepareSecondsLeft(PREPARE_SECONDS);
      playCountdownTick();
      setPhase("prepare");
      return;
    }

    if (phase === "prepare") {
      // Cancel prepare → go back to idle
      setPhase("idle");
      setPrepareSecondsLeft(PREPARE_SECONDS);
      return;
    }

    // phase === "workout" → pause / resume
    setIsActive((currentValue) => !currentValue);
  }, [phase, totalSeconds]);

  const selectMode = (nextMode: WorkoutMode) => {
    if (nextMode === activeMode.mode) {
      return;
    }

    setSelectedMode(nextMode);
    setIsActive(false);
    setPhase("idle");
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
    setPrepareSecondsLeft(PREPARE_SECONDS);
  };

  return {
    mode: activeMode.mode,
    activeMode,
    modes: config.modes,
    totalSeconds,
    secondsLeft,
    isActive,
    currentRep,
    secondsToNextRep,
    phase,
    prepareSecondsLeft,
    toggleTimer,
    resetTimer,
    selectMode,
  };
}
