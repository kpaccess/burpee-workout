"use client";

import React, { useMemo } from "react";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VideocamIcon from "@mui/icons-material/Videocam";
import {
  buildWorkoutTimerConfig,
  formatWorkoutTimerTime,
} from "../../../shared/workoutTimer";
import { useWorkoutTimer } from "../hooks/useWorkoutTimer";
import { WorkoutTier } from "../types";

interface WorkoutTimerProps {
  tier: WorkoutTier;
  sealsGoal?: number;
  sixCountsGoal?: number;
  onFinish?: () => void;
  onOpenVideo?: () => void;
}

export default function WorkoutTimer({
  tier,
  sealsGoal = 0,
  sixCountsGoal = 0,
  onFinish,
  onOpenVideo,
}: WorkoutTimerProps) {
  const timerConfig = useMemo(
    () =>
      buildWorkoutTimerConfig({
        tier,
        sealsGoal,
        sixCountsGoal,
      }),
    [sealsGoal, sixCountsGoal, tier],
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
    onFinish,
  });

  const isBeginnerTrack = tier === "beginner";

  return (
    <Card
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 2,
      }}
    >
      <TimerOutlinedIcon color="secondary" sx={{ fontSize: 42 }} />
      <Typography variant="h6" fontWeight={800}>
        Session Timer
      </Typography>

      {modes.length > 1 ? (
        <Stack direction="row" spacing={1}>
          {modes.map((entry) => (
            <Chip
              key={entry.mode}
              label={entry.label}
              color={activeMode.mode === entry.mode ? "primary" : "default"}
              onClick={() => selectMode(entry.mode)}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>
      ) : (
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {activeMode.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeMode.description}
          </Typography>
        </Box>
      )}

      <Typography variant="h2" fontWeight={900} color="primary.main">
        {formatWorkoutTimerTime(secondsLeft)}
      </Typography>

      {activeMode.goal > 0 ? (
        <Box>
          <Typography
            variant="subtitle2"
            color="secondary.main"
            fontWeight={800}
          >
            REP {currentRep} / {activeMode.goal}
          </Typography>
          {isActive && secondsToNextRep !== null && (
            <Typography variant="body2" color="text.secondary">
              Next in {secondsToNextRep}s
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Beginner paces at 1 rep every minute for 20 total reps.
        </Typography>
      )}

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          startIcon={isActive ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={toggleTimer}
        >
          {isActive ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={resetTimer}
        >
          Reset
        </Button>
      </Stack>

      <Button
        variant="text"
        startIcon={<VideocamIcon />}
        onClick={onOpenVideo}
        sx={{ color: "text.secondary" }}
      >
        {isBeginnerTrack ? "Open Beginner Video" : "Open Tutorials"}
      </Button>
    </Card>
  );
}
