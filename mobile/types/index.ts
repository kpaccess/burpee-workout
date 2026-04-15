export type WorkoutTier = "beginner" | "advanced";

export interface WorkoutLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  levelCompleted?: string;
  workoutType?: "N" | "C"; // N = Navy Seals, C = 6-counts
  notes?: string;
}

export interface UserData {
  userId?: string;
  startDate: string;
  startWeight: number;
  startPictureUrl: string | null;
  workoutTier?: WorkoutTier;

  endDate?: string;
  endWeight?: number;
  endPictureUrl?: string | null;

  isGraduated?: boolean;
  workoutLogs?: WorkoutLog[];
  currentLevelId?: string;
}

export interface LevelDescription {
  id: string;
  name: string;
  description: string;
  seals: number;
  sixCounts: number;
  timeLimitMintues: number;
}

export const ADVANCED_LEVELS: LevelDescription[] = [
  {
    id: "1A",
    name: "Level 1A",
    description: "No Landmark Workout",
    seals: 0,
    sixCounts: 0,
    timeLimitMintues: 0,
  },
  {
    id: "1B",
    name: "Level 1B",
    description: "20 Navy Seals in 20 min, 50 6-counts in 20 min.",
    seals: 20,
    sixCounts: 50,
    timeLimitMintues: 20,
  },
  {
    id: "1C",
    name: "Level 1C",
    description: "40 Navy Seals in 20 min, 100 6-counts in 20 min.",
    seals: 40,
    sixCounts: 100,
    timeLimitMintues: 20,
  },
  {
    id: "1D",
    name: "Level 1D",
    description: "60 Navy Seals in 20 min, 150 6-counts in 20 min.",
    seals: 60,
    sixCounts: 150,
    timeLimitMintues: 20,
  },
  {
    id: "2",
    name: "Level 2",
    description: "80 Navy Seals in 20 min, 200 6-counts in 20 min.",
    seals: 80,
    sixCounts: 200,
    timeLimitMintues: 20,
  },
  {
    id: "3",
    name: "Level 3",
    description: "100 Navy Seals in 20 min, 250 6-counts in 20 min.",
    seals: 100,
    sixCounts: 250,
    timeLimitMintues: 20,
  },
  {
    id: "4",
    name: "Level 4",
    description: "120 Navy Seals in 20 min, 275 6-counts in 20 min.",
    seals: 120,
    sixCounts: 275,
    timeLimitMintues: 20,
  },
  {
    id: "grad",
    name: "Graduation",
    description: "150 Navy Seals in 20 min, 325 6-counts in 20 min.",
    seals: 150,
    sixCounts: 325,
    timeLimitMintues: 20,
  },
];

export const BEGINNER_LEVELS: LevelDescription[] = [
  {
    id: "B1",
    name: "Beginner 1",
    description: "25 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 25,
    timeLimitMintues: 20,
  },
  {
    id: "B2",
    name: "Beginner 2",
    description: "40 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 40,
    timeLimitMintues: 20,
  },
  {
    id: "B3",
    name: "Beginner 3",
    description: "55 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 55,
    timeLimitMintues: 20,
  },
  {
    id: "B4",
    name: "Beginner 4",
    description: "70 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 70,
    timeLimitMintues: 20,
  },
  {
    id: "B5",
    name: "Beginner 5",
    description: "90 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 90,
    timeLimitMintues: 20,
  },
  {
    id: "B6",
    name: "Beginner 6",
    description: "110 burpees (no pushups) in 20 min.",
    seals: 0,
    sixCounts: 110,
    timeLimitMintues: 20,
  },
];

export const LEVELS: LevelDescription[] = ADVANCED_LEVELS;
