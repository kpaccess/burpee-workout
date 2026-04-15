"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  TextField,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { motion } from "framer-motion";
import Image from "next/image";
import { ADVANCED_LEVELS, BEGINNER_LEVELS, WorkoutTier } from "../types";
import { useAuth } from "../context/AuthContext";

interface OnboardingProps {
  onComplete: (data: {
    startDate: string;
    startWeight: number;
    startPictureUrl: string | null;
    currentLevelId: string;
    workoutTier: WorkoutTier;
    trialEndsAt: string;
  }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const FREE_ACCESS_DAYS = 60;
  const { user, logout } = useAuth();
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [weight, setWeight] = useState("");
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [level, setLevel] = useState("B1");
  const [workoutTier, setWorkoutTier] = useState<WorkoutTier>("beginner");
  const isBeginnerTrack = workoutTier === "beginner";
  const levelsForTier = useMemo(
    () => (isBeginnerTrack ? BEGINNER_LEVELS : ADVANCED_LEVELS),
    [isBeginnerTrack],
  );

  const accountLabel =
    user?.email || (user ? `UID: ${user.uid}` : "Unknown account");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    const start = new Date(`${startDate}T00:00:00`);
    const trialEnds = new Date(start);
    trialEnds.setDate(trialEnds.getDate() + FREE_ACCESS_DAYS);

    onComplete({
      startDate,
      startWeight: parseFloat(weight),
      startPictureUrl: pictureUrl,
      currentLevelId: level,
      workoutTier,
      trialEndsAt: trialEnds.toISOString(),
    });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 500, width: "100%" }}>
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          color="primary"
          fontWeight={800}
        >
          Busy People Program
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          It&apos;s time to begin your journey. Start with your day 1 stats.
        </Typography>

        <Alert severity={user ? "info" : "warning"} sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            component="span"
            display="block"
            gutterBottom
          >
            {user ? (
              <>
                Signed in as <strong>{accountLabel}</strong>. Your profile loads
                from this account. If you already set up on another device, sign
                in with the same account here.
              </>
            ) : (
              <>
                Session looks out of sync. Use the button below to reset auth
                and sign in again.
              </>
            )}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
          >
            Sign out and use a different account
          </Button>
        </Alert>

        <Alert
          severity={workoutTier === "beginner" ? "success" : "info"}
          sx={{ mb: 3 }}
        >
          {workoutTier === "beginner"
            ? "You get 60-day free access from your start date. After that, advanced features require a subscription."
            : "You get 60-day free access from your start date. After that, advanced features require a subscription."}
        </Alert>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="Weight (lbs/kg)"
              type="number"
              fullWidth
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <FormControl fullWidth required>
              <InputLabel id="workout-tier-label">Workout Type</InputLabel>
              <Select
                labelId="workout-tier-label"
                value={workoutTier}
                label="Workout Type"
                onChange={(e) => {
                  const nextTier = e.target.value as WorkoutTier;
                  setWorkoutTier(nextTier);
                  setLevel(nextTier === "beginner" ? "B1" : "1B");
                }}
              >
                <MenuItem value="beginner">
                  Beginner - starter guidance and no-pushup progression
                </MenuItem>
                <MenuItem value="advanced">
                  Advanced - paid track with premium workouts
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="level-label">Starting Level</InputLabel>
              <Select
                labelId="level-label"
                value={level}
                label="Starting Level"
                onChange={(e) => setLevel(e.target.value)}
              >
                {levelsForTier.map((lvl) => (
                  <MenuItem key={lvl.id} value={lvl.id}>
                    {lvl.name} - {lvl.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                border: "2px dashed rgba(255,255,255,0.2)",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
              }}
            >
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="icon-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="icon-button-file">
                <Box sx={{ mb: 2 }}>
                  {pictureUrl ? (
                    <Image
                      src={pictureUrl}
                      alt="Preview"
                      width={320}
                      height={200}
                      unoptimized
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: 200,
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      Upload a picture of yourself
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                >
                  {pictureUrl ? "Change Picture" : "Take Picture"}
                </Button>
              </label>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2, py: 1.5, fontSize: "1.1rem" }}
            >
              {workoutTier === "beginner"
                ? "Start Beginner Program"
                : "Continue to Advanced Program"}
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
