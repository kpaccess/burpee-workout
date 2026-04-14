export type SharedWorkoutTier = "beginner" | "advanced";
export type WorkoutMode = "N" | "C";

export interface WorkoutTimerModeConfig {
  mode: WorkoutMode;
  label: string;
  shortLabel: string;
  description: string;
  goal: number;
}

export interface WorkoutTimerConfig {
  tier: SharedWorkoutTier;
  initialMinutes: number;
  defaultMode: WorkoutMode;
  modes: WorkoutTimerModeConfig[];
}

interface BuildWorkoutTimerConfigOptions {
  tier: SharedWorkoutTier;
  initialMinutes?: number;
  sealsGoal?: number;
  sixCountsGoal?: number;
}

export function buildWorkoutTimerConfig({
  tier,
  initialMinutes = 20,
  sealsGoal = 0,
  sixCountsGoal = 0,
}: BuildWorkoutTimerConfigOptions): WorkoutTimerConfig {
  if (tier === "beginner") {
    return {
      tier,
      initialMinutes,
      defaultMode: "C",
      modes: [
        {
          mode: "C",
          label: "Beginner Session",
          shortLabel: "B",
          description: "One simple beginner workout",
          goal: 0,
        },
      ],
    };
  }

  return {
    tier,
    initialMinutes,
    defaultMode: "N",
    modes: [
      {
        mode: "N",
        label: "Navy Seals",
        shortLabel: "N",
        description: "Full range burpees",
        goal: sealsGoal,
      },
      {
        mode: "C",
        label: "6-Counts",
        shortLabel: "C",
        description: "Strict 6-count burpees",
        goal: sixCountsGoal,
      },
    ],
  };
}

export function formatWorkoutTimerTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
