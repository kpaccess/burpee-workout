import { useEffect, useMemo, useRef, useState } from "react";
import {
  WorkoutMode,
  WorkoutTimerConfig,
  WorkoutTimerModeConfig,
} from "../lib/workoutTimer";

const REP_EPSILON = 1e-9;

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

          if (rep > previousRep) {
            setCurrentRep(rep);
            onRepBoundaryRef.current?.(rep, activeMode.mode);
          }
        }

        if (clampedNextValue === 0) {
          setIsActive(false);
          onFinishRef.current?.();
        }

        return clampedNextValue;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeMode.mode, intervalSeconds, isActive, secondsLeft, totalSeconds]);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
  };

  const toggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
      setCurrentRep(0);
      setIsActive(true);
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
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
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
    toggleTimer,
    resetTimer,
    selectMode,
  };
}
