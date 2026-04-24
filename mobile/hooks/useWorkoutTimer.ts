import { useEffect, useMemo, useRef, useState } from "react";
import {
  WorkoutMode,
  WorkoutTimerConfig,
  WorkoutTimerModeConfig,
} from "../lib/workoutTimer";

const PREPARE_SECONDS = 10;
const REP_EPSILON = 1e-9;

export type TimerPhase = "idle" | "prepare" | "workout" | "done";

interface UseWorkoutTimerOptions {
  config: WorkoutTimerConfig;
  onFinish?: () => void;
  onRepBoundary?: (rep: number, mode: WorkoutMode) => void;
  onPrepareTick?: () => void;
  onGo?: () => void;
  onPrepareWarning?: () => void;
  onRepWarning?: () => void;
}

export function useWorkoutTimer({
  config,
  onFinish,
  onRepBoundary,
  onPrepareTick,
  onGo,
  onPrepareWarning,
  onRepWarning,
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
  const onPrepareTickRef = useRef(onPrepareTick);
  const onGoRef = useRef(onGo);
  const onPrepareWarningRef = useRef(onPrepareWarning);
  const onRepWarningRef = useRef(onRepWarning);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onRepBoundaryRef.current = onRepBoundary;
    onPrepareTickRef.current = onPrepareTick;
    onGoRef.current = onGo;
    onPrepareWarningRef.current = onPrepareWarning;
    onRepWarningRef.current = onRepWarning;
  }, [onFinish, onRepBoundary, onPrepareTick, onGo, onPrepareWarning, onRepWarning]);

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
      onGoRef.current?.();
      setPhase("workout");
      setIsActive(true);
      return;
    }

    const timerId = setInterval(() => {
      setPrepareSecondsLeft((prev) => {
        const next = prev - 1;
        if (next > 0) {
          if (next <= 3) {
            onPrepareWarningRef.current?.();
          } else {
            onPrepareTickRef.current?.();
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
            onRepWarningRef.current?.();
          }

          if (rep > previousRep) {
            setCurrentRep(rep);
            onRepBoundaryRef.current?.(rep, activeMode.mode);
          }
        }

        if (clampedNextValue === 0) {
          setIsActive(false);
          setPhase("done");
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

  const toggleTimer = () => {
    if (phase === "idle" || phase === "done") {
      setSecondsLeft(totalSeconds);
      setCurrentRep(0);
      setPrepareSecondsLeft(PREPARE_SECONDS);
      onPrepareTickRef.current?.();
      setPhase("prepare");
      return;
    }

    if (phase === "prepare") {
      setPhase("idle");
      setPrepareSecondsLeft(PREPARE_SECONDS);
      return;
    }

    setIsActive((currentValue) => !currentValue);
  };

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
