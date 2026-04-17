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
    phase,
    prepareSecondsLeft,
    toggleTimer,
    resetTimer,
    selectMode,
  } = useWorkoutTimer({
    config: timerConfig,
    onFinish,
  });

  const isBeginnerTrack = tier === "beginner";
  const isPreparing = phase === "prepare";

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

      {/* ── Prepare countdown overlay ────────────────────────────── */}
      {isPreparing ? (
        <Box>
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: "#FFB300",
              animation: "pulse 1s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1, transform: "scale(1)" },
                "50%": { opacity: 0.7, transform: "scale(1.08)" },
              },
            }}
          >
            {prepareSecondsLeft}
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ color: "#FFB300", mt: 0.5 }}
          >
            GET READY
          </Typography>
        </Box>
      ) : (
        <Typography variant="h2" fontWeight={900} color="primary.main">
          {formatWorkoutTimerTime(secondsLeft)}
        </Typography>
      )}

      {!isPreparing && activeMode.goal > 0 ? (
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
      ) : !isPreparing ? (
        <Typography variant="body2" color="text.secondary">
          Beginner paces at 1 rep every minute for 20 total reps.
        </Typography>
      ) : null}

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          startIcon={
            isPreparing ? (
              <PauseIcon />
            ) : isActive ? (
              <PauseIcon />
            ) : (
              <PlayArrowIcon />
            )
          }
          onClick={toggleTimer}
          color={isPreparing ? "warning" : "primary"}
        >
          {isPreparing
            ? "Cancel"
            : isActive
              ? "Pause"
              : phase === "done"
                ? "Restart"
                : "Start"}
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
