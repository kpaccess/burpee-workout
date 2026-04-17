"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  Select,
  MenuItem,
  Menu,
  InputLabel,
  FormControl,
  Alert,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import {
  ADVANCED_LEVELS,
  BEGINNER_LEVELS,
  UserData,
  WorkoutLog,
} from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  differenceInDays,
  isAfter,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useAuth } from "../context/AuthContext";
import { toDateKey } from "../lib/date";
import { useSubscription } from "../hooks/useSubscription";
import { useRouter } from "next/navigation";
import WorkoutTimer from "./WorkoutTimer";

interface DashboardProps {
  userData: UserData;
  onMilestoneCheckin: () => void;
  onToggleWorkout?: (
    dateStr: string,
    completed: boolean,
    type?: "N" | "C",
  ) => void;
  onUpdateData?: (data: Partial<UserData>) => void;
  syncError?: string | null;
}

export default function Dashboard({
  userData,
  onMilestoneCheckin,
  onToggleWorkout,
  onUpdateData,
  syncError,
}: DashboardProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isPro } = useSubscription(user?.uid ?? null, user?.email);
  const [openVideo, setOpenVideo] = useState(false);
  const [openLevelChange, setOpenLevelChange] = useState(false);
  const [newLevel, setNewLevel] = useState(userData.currentLevelId || "1B");
  const [workoutMenuAnchor, setWorkoutMenuAnchor] = useState<{
    anchorEl: HTMLElement;
    dateStr: string;
  } | null>(null);
  const [dismissedAdvancedSuggestion, setDismissedAdvancedSuggestion] =
    useState(false);
  // Legacy users may not have workoutTier stored yet; keep them on advanced
  // unless they are clearly on a beginner B-level.
  const inferredTier =
    userData.currentLevelId && /^B[1-6]$/.test(userData.currentLevelId)
      ? "beginner"
      : "advanced";
  const workoutTier = userData.workoutTier ?? inferredTier;
  const isAdvancedTrack = workoutTier === "advanced";
  const isBeginnerTrack = !isAdvancedTrack;
  const levelsForTrack = isAdvancedTrack ? ADVANCED_LEVELS : BEGINNER_LEVELS;

  const startDate = new Date(userData.startDate);
  const milestoneDate = addMonths(startDate, 6);
  const today = new Date();

  const isMilestoneReached = isAfter(today, milestoneDate) && !userData.endDate;
  const daysPassed = differenceInDays(today, startDate);
  const daysToMilestone = differenceInDays(milestoneDate, today);

  // Generate calendar days for the selected month
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const startDateGrid = startOfWeek(currentMonth);
  const endDateGrid = endOfWeek(endOfMonth(currentMonth));

  const trackingDays = eachDayOfInterval({
    start: startDateGrid,
    end: endDateGrid,
  }).map((d) => format(d, "yyyy-MM-dd"));

  const handleToggle = (
    dateStr: string,
    currentStatus: boolean,
    type?: "N" | "C",
  ) => {
    if (onToggleWorkout) {
      onToggleWorkout(dateStr, !currentStatus, type);
    }
  };

  const handleChangeLevel = () => {
    if (onUpdateData) {
      onUpdateData({ currentLevelId: newLevel });
    }
    setOpenLevelChange(false);
  };

  const handleDay1PictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateData) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateData({ startPictureUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    // Reset input so selecting the same file again still triggers onChange.
    e.target.value = "";
  };

  const getWorkoutLogForDate = (dateStr: string): WorkoutLog | null => {
    const logs = userData.workoutLogs || [];
    const normalizedDate = toDateKey(dateStr);
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      if (toDateKey(logs[i].date) === normalizedDate) {
        return logs[i];
      }
    }
    return null;
  };

  const formatWorkoutLogLabel = (levelCompleted?: string): string | null => {
    if (!levelCompleted) return null;

    const beginnerMatch = levelCompleted.match(/^B([1-6])\(C\)$/);
    if (beginnerMatch) {
      return `Beginner ${beginnerMatch[1]}`;
    }

    // Backward-compatible display for older beginner logs saved before B-levels.
    if (isBeginnerTrack && levelCompleted === "1B(C)") {
      return "Beginner 1";
    }

    const advancedMatch = levelCompleted.match(/^([0-9A-Za-z]+)\(([NC])\)$/);
    if (advancedMatch) {
      const [, levelId, mode] = advancedMatch;
      return `${levelId}(${mode})`;
    }

    return levelCompleted;
  };

  const day1PictureUrl =
    userData.startPictureUrl ||
    (userData as UserData & { startPictureURl?: string }).startPictureURl ||
    null;
  const currentLevel = userData.currentLevelId
    ? (levelsForTrack.find((l) => l.id === userData.currentLevelId) ?? null)
    : null;
  const hasCompletedB6 = (userData.workoutLogs ?? []).some(
    (log) => log.completed && (log.levelCompleted ?? "").startsWith("B6"),
  );
  const shouldShowAdvancedSuggestion =
    isBeginnerTrack && hasCompletedB6 && !dismissedAdvancedSuggestion;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography
              variant="h3"
              fontWeight={800}
              color="primary"
              gutterBottom
            >
              My Burpee Journey
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Day {Math.max(0, daysPassed)} • Busy People Program
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              color="error"
              onClick={logout}
              size="small"
            >
              Log Out / Reset
            </Button>
          </Box>
        </Box>

        {/* Milestone Alert */}
        <AnimatePresence>
          {isMilestoneReached && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginBottom: 24 }}
            >
              <Card
                sx={{
                  p: 3,
                  border: "1px solid #FF3366",
                  background: "rgba(255, 51, 102, 0.1)",
                }}
              >
                <Typography variant="h6" color="primary" gutterBottom>
                  🎉 6 Month Milestone Reached!
                </Typography>
                <Typography variant="body1" mb={2}>
                  Time to check in, update your weight, and add a new photo to
                  see your progress.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onMilestoneCheckin}
                >
                  Complete Check-in
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {shouldShowAdvancedSuggestion && (
          <Card
            sx={{
              p: 3,
              mb: 3,
              border: "1px solid rgba(255, 193, 7, 0.45)",
              background: "rgba(255, 193, 7, 0.08)",
            }}
          >
            <Typography variant="h6" color="warning.main" gutterBottom>
              Nice work - you completed Beginner B6
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You are ready for the Advanced track. Want to move to Level 1B and
              keep progressing?
            </Typography>
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                color="warning"
                onClick={() => {
                  if (!onUpdateData) return;
                  onUpdateData({
                    workoutTier: "advanced",
                    currentLevelId: "1B",
                  });
                  setDismissedAdvancedSuggestion(true);
                }}
              >
                Switch to Advanced (1B)
              </Button>
              <Button
                variant="text"
                onClick={() => setDismissedAdvancedSuggestion(true)}
              >
                Maybe later
              </Button>
            </Box>
          </Card>
        )}

        {/* Stats and Video Row */}
        <Grid container spacing={3} mb={4}>
          <Grid sx={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <CalendarMonthIcon color="secondary" /> Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Do the program on:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {["Mon", "Tue", "Thu", "Fri"].map((day) => (
                  <Chip
                    key={day}
                    label={day}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Card>
          </Grid>

          <Grid sx={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <LocalFireDepartmentIcon color="secondary" /> Stats Overview
              </Typography>
              <Box mt={1}>
                {isAdvancedTrack ? (
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography
                      variant="body1"
                      color="primary"
                      fontWeight="bold"
                    >
                      Current: {currentLevel?.name ?? "Not set"}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setOpenLevelChange(true)}
                    >
                      {userData.currentLevelId ? "Update" : "Set Level"}
                    </Button>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography
                      variant="body1"
                      color="primary"
                      fontWeight="bold"
                    >
                      Current: {currentLevel?.name ?? "Not set"}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setOpenLevelChange(true)}
                    >
                      {userData.currentLevelId ? "Update" : "Set Level"}
                    </Button>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Start Date: {startDate.toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starting Weight: {userData.startWeight}
                </Typography>
                {isBeginnerTrack && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Workout option: Burpee without pushups
                  </Typography>
                )}
                <Box mt={1.5}>
                  <Chip
                    label={
                      isAdvancedTrack
                        ? isPro
                          ? "Advanced track active"
                          : "Advanced track selected"
                        : "Beginner track selected"
                    }
                    color={isAdvancedTrack ? "primary" : "secondary"}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                {userData.trialEndsAt && (
                  <Typography variant="body2" color="secondary" mt={1}>
                    Trial ends on:{" "}
                    {new Date(userData.trialEndsAt).toLocaleDateString()}
                  </Typography>
                )}
                {!isMilestoneReached && daysToMilestone > 0 && (
                  <Typography variant="body2" color="secondary" mt={1}>
                    {daysToMilestone} days until 6-month check-in.
                  </Typography>
                )}
                {userData.endDate && (
                  <>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Milestone reached on:{" "}
                      {new Date(userData.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Weight: {userData.endWeight}
                    </Typography>
                  </>
                )}
              </Box>
            </Card>
          </Grid>

          <Grid sx={{ xs: 12, md: 4 }}>
            <WorkoutTimer
              tier={workoutTier}
              sealsGoal={currentLevel?.seals ?? 0}
              sixCountsGoal={currentLevel?.sixCounts ?? 0}
              onOpenVideo={() => setOpenVideo(true)}
            />
          </Grid>
        </Grid>

        {/* Monthly Tracker Row */}
        <Card sx={{ p: 3, mb: 4 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" color="primary">
              Workout Calendar
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                Prev
              </Button>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: 120, textAlign: "center" }}
              >
                {format(currentMonth, "MMMM yyyy")}
              </Typography>
              <Button
                size="small"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                Next
              </Button>
            </Box>
          </Box>
          {syncError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {syncError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Check off your workout on scheduled days (Mon, Tue, Thu, Fri)
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns="repeat(7, 1fr)"
            gap={1}
            mb={1}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Typography
                key={day}
                variant="caption"
                color="text.secondary"
                align="center"
                fontWeight="bold"
              >
                {day}
              </Typography>
            ))}
          </Box>

          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
            {trackingDays.map((dateStr) => {
              const dayObj = new Date(dateStr + "T00:00:00");
              const _dayName = format(dayObj, "EEE");
              const dayLog = getWorkoutLogForDate(dateStr);
              const isCompleted = !!dayLog?.completed;
              const isWorkoutDay = ["Mon", "Tue", "Thu", "Fri"].includes(
                _dayName,
              );
              const isCurrentMonth = isSameMonth(dayObj, currentMonth);

              return (
                <Box
                  key={dateStr}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: 80,
                    p: 0.5,
                    borderRadius: 2,
                    border: isCompleted
                      ? "1px solid #00E5FF"
                      : isWorkoutDay
                        ? "1px solid #333"
                        : "1px dashed #222",
                    background: isCompleted
                      ? "rgba(0, 229, 255, 0.1)"
                      : "transparent",
                    opacity: isCurrentMonth ? (isWorkoutDay ? 1 : 0.6) : 0.2,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isCurrentMonth ? "bold" : "normal"}
                  >
                    {format(dayObj, "d")}
                  </Typography>
                  {isWorkoutDay ? (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      mt={0.5}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onChange={(e) => {
                          if (isCompleted) {
                            handleToggle(dateStr, true); // uncheck
                          } else if (isBeginnerTrack || !isPro) {
                            handleToggle(dateStr, false);
                          } else {
                            setWorkoutMenuAnchor({
                              anchorEl: e.currentTarget.parentElement as HTMLElement,
                              dateStr,
                            });
                          }
                        }}
                        color="secondary"
                        size="small"
                        sx={{ p: 0.5 }}
                      />
                      {isCompleted && dayLog?.levelCompleted && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#00E5FF",
                            lineHeight: 1,
                            fontSize: "0.65rem",
                          }}
                          align="center"
                        >
                          {formatWorkoutLogLabel(dayLog.levelCompleted)}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, color: "#666", fontSize: "0.65rem" }}
                    >
                      Rest
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Progress Photos */}
        <Typography variant="h5" fontWeight={700} gutterBottom mt={4} mb={2}>
          Progress Photos
        </Typography>
        <Grid container spacing={2} mb={4}>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 2, height: "100%" }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary"
                gutterBottom
              >
                Day 1
              </Typography>
              {day1PictureUrl ? (
                <Box
                  component="img"
                  src={day1PictureUrl}
                  alt="Day 1 progress"
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No Day 1 picture uploaded yet.
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="update-day1-picture"
                  type="file"
                  onChange={handleDay1PictureChange}
                />
                <label htmlFor="update-day1-picture">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                  >
                    {day1PictureUrl
                      ? "Replace Day 1 Picture"
                      : "Upload Day 1 Picture"}
                  </Button>
                </label>
              </Box>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 2, height: "100%" }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="secondary"
                gutterBottom
              >
                6-Month Check-in
              </Typography>
              {userData.endPictureUrl ? (
                <Box
                  component="img"
                  src={userData.endPictureUrl}
                  alt="6-month progress"
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Your latest check-in picture will appear here after milestone
                  check-in.
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>

        <>
          <Typography variant="h5" fontWeight={700} gutterBottom mt={4} mb={2}>
            Program Levels
          </Typography>
          <Grid container spacing={2}>
            {levelsForTrack.map((lvl) => (
              <Grid sx={{ xs: 12, sm: 6, md: 3 }} key={lvl.id}>
                <Card
                  sx={{
                    p: 3,
                    transition: "0.3s",
                    border:
                      userData.currentLevelId === lvl.id
                        ? "2px solid #FF3366"
                        : "1px solid transparent",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      borderColor: "secondary.main",
                    },
                  }}
                >
                  <Typography variant="h6" color="secondary" gutterBottom>
                    {lvl.name}{" "}
                    {userData.currentLevelId === lvl.id && "(Current)"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lvl.description}
                  </Typography>
                  {isAdvancedTrack ? (
                    lvl.seals > 0 && (
                      <Box mt={2} display="flex" gap={1}>
                        <Chip
                          label={`${lvl.seals} Seals`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${lvl.sixCounts} 6-counts`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )
                  ) : (
                    <Box mt={2} display="flex" gap={1}>
                      <Chip
                        label={`${lvl.sixCounts} Burpees (no pushups)`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </>

        {/* Update Level Dialog */}
        <Dialog
          open={openLevelChange}
          onClose={() => setOpenLevelChange(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update Current Level</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Have you progressed or want to scale back? Select your new active
              level.
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="change-level-label">Level</InputLabel>
              <Select
                labelId="change-level-label"
                value={newLevel}
                label="Level"
                onChange={(e) => setNewLevel(e.target.value)}
              >
                {levelsForTrack.map((lvl) => (
                  <MenuItem key={lvl.id} value={lvl.id}>
                    {lvl.name} - {lvl.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={() => setOpenLevelChange(false)}>Cancel</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleChangeLevel}
              >
                Save Level
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Video Dialog */}
        <Dialog
          open={openVideo}
          onClose={() => setOpenVideo(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isAdvancedTrack ? "Advanced Tutorials" : "Beginner Program Video"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
            >
              {!isAdvancedTrack && (
                <Card sx={{ p: 3, border: "1px dashed rgba(255,255,255,0.2)" }}>
                  <Typography variant="subtitle1" mb={1} fontWeight="bold">
                    Beginner Burpee Demo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Simple no-pushup burpee demo. Keep this as your baseline
                    movement for Beginner levels.
                  </Typography>
                  <Button
                    variant="contained"
                    component="a"
                    href="https://www.youtube.com/shorts/O9E5BSf2l1Q"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Watch beginner video
                  </Button>
                </Card>
              )}

              {isAdvancedTrack && isPro && (
                <>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle1" mb={1} fontWeight="bold">
                      Program Intro (Full Video)
                    </Typography>
                    <a
                      href="https://www.youtube.com/watch?v=3Yooen5zgCg&list=PLhE7BYqSXmSEuE2qoJE9w3rLEzuenuoLq&index=1"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#00E5FF" }}
                    >
                      Watch on YouTube
                    </a>
                  </Card>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle1" mb={1} fontWeight="bold">
                      Burpee Form Tutorials
                    </Typography>
                    <a
                      href="https://www.youtube.com/playlist?list=PLhE7BYqSXmSEJFzla9_j34HEmLdEsOrvF"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#00E5FF" }}
                    >
                      View Playlist on YouTube
                    </a>
                  </Card>
                </>
              )}

              {isAdvancedTrack && !isPro && (
                <Card sx={{ p: 3, border: "1px solid rgba(245,158,11,0.35)" }}>
                  <Typography variant="subtitle1" mb={1} fontWeight="bold">
                    Advanced videos are paid
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Your launch free period is active for 60 days from start.
                    Subscribe to keep advanced tutorial access afterward.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setOpenVideo(false);
                      router.push("/pricing");
                    }}
                  >
                    View Advanced Pricing
                  </Button>
                </Card>
              )}
            </Box>
          </DialogContent>
        </Dialog>
        {/* Workout Selection Menu */}
        {isAdvancedTrack && isPro && (
          <Menu
            anchorEl={workoutMenuAnchor?.anchorEl}
            open={Boolean(workoutMenuAnchor)}
            onClose={() => setWorkoutMenuAnchor(null)}

          >
            <MenuItem
              onClick={() => {
                handleToggle(workoutMenuAnchor!.dateStr, false, "N");
                setWorkoutMenuAnchor(null);
              }}
            >
              {userData.currentLevelId || ""}(N)
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleToggle(workoutMenuAnchor!.dateStr, false, "C");
                setWorkoutMenuAnchor(null);
              }}
            >
              {userData.currentLevelId || ""}(C)
            </MenuItem>
          </Menu>
        )}
      </motion.div>
    </Box>
  );
}
