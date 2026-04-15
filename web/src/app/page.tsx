"use client";

import React, { useState } from "react";
import { useUserData } from "../hooks/useUserData";
import Onboarding from "../components/Onboarding";
import Dashboard from "../components/Dashboard";
import MilestoneCheckin from "../components/MilestoneCheckin";
import LandingPage from "../components/LandingPage";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function Home() {
  const { userData, isLoaded, saveUserData, toggleWorkoutLog, syncError } =
    useUserData();
  const { user, loading: authLoading } = useAuth();
  const [showMilestoneCheckin, setShowMilestoneCheckin] = useState(false);

  if (!isLoaded || authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (syncError && userData === undefined) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Card sx={{ p: 3, maxWidth: 520, width: "100%" }}>
          <Typography variant="h6" gutterBottom color="primary">
            Could not load your data
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {syncError}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This usually means Firestore read access failed for the current user
            or project.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </Box>
    );
  }

  if (!userData) {
    return <Onboarding onComplete={(d) => saveUserData(d)} />;
  }

  if (showMilestoneCheckin) {
    return (
      <MilestoneCheckin
        onComplete={(d) => {
          saveUserData(d);
          setShowMilestoneCheckin(false);
        }}
        onCancel={() => setShowMilestoneCheckin(false)}
      />
    );
  }

  return (
    <Dashboard
      userData={userData}
      onMilestoneCheckin={() => setShowMilestoneCheckin(true)}
      onToggleWorkout={toggleWorkoutLog}
      onUpdateData={saveUserData}
      syncError={syncError}
    />
  );
}
