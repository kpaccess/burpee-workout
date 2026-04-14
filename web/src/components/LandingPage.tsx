"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import BoltIcon from "@mui/icons-material/Bolt";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const weeklySchedule = [
    { day: "Mon", train: true },
    { day: "Tue", train: true },
    { day: "Wed", train: false },
    { day: "Thu", train: true },
    { day: "Fri", train: true },
    { day: "Sat", train: false },
    { day: "Sun", train: false },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 4, md: 8 },
        background:
          "radial-gradient(circle at 10% 10%, rgba(255,51,102,0.16), transparent 38%), radial-gradient(circle at 90% 5%, rgba(0,229,255,0.12), transparent 35%), #0a0a0a",
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={2} alignItems="flex-start" mb={5}>
            <Chip
              icon={<FitnessCenterIcon />}
              label="BurpeePacer"
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            />
            <Typography
              variant="h2"
              sx={{ fontWeight: 900, lineHeight: 1.05, maxWidth: 780 }}
            >
              Burpees: Simple, Brutal,
              <Box component="span" sx={{ color: "primary.main" }}>
                {" "}
                and Proven
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 760 }}
            >
              Learn the story behind the burpee, why it still works, and when to
              train with push-ups vs without push-ups. Inside the app, you can
              choose either version for the same 20-minute sessions.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                maxWidth: 760,
                color: "rgba(255,255,255,0.86)",
                fontWeight: 600,
              }}
            >
              Consistency is the real secret. Follow your schedule, show up on
              your training days, and progress compounds.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} pt={1}>
              <Button
                variant="contained"
                size="large"
                startIcon={<WorkspacePremiumIcon />}
                onClick={() => router.push("/login")}
              >
                Start Free 30-Day Plan
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push("/pricing")}
              >
                See Pro Plans
              </Button>
              <Button
                variant="text"
                size="large"
                onClick={() => router.push("/login")}
                sx={{ color: "text.secondary" }}
              >
                Already a member? Sign in
              </Button>
            </Stack>
          </Stack>
        </motion.div>

        <Grid container spacing={3} mb={3}>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3.5, height: "100%" }}>
              <Typography variant="h5" fontWeight={800} mb={1.5}>
                Who Started the Burpee?
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                The exercise was created by Royal H. Burpee, a U.S.
                physiologist, in 1939 as a quick full-body fitness test. It
                later became popular in military conditioning and functional
                training because it builds conditioning fast with no equipment.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  icon={<MilitaryTechIcon />}
                  label="Origin: 1939"
                />
                <Chip size="small" icon={<BoltIcon />} label="No equipment" />
              </Stack>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3.5, height: "100%" }}>
              <Typography variant="h5" fontWeight={800} mb={1.5}>
                Why Burpees Work
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                Burpees train legs, core, chest, shoulders, and lungs at the
                same time.
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                They improve work capacity, cardiovascular fitness, and mental
                toughness in short sessions.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                They are easy to scale from beginner to advanced and perfect for
                consistency-based programs.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Card
          sx={{
            p: { xs: 3, md: 3.5 },
            mb: 3,
            border: "1px solid rgba(255,51,102,0.35)",
            background:
              "linear-gradient(120deg, rgba(255,51,102,0.08) 0%, rgba(255,255,255,0.02) 65%)",
          }}
        >
          <Typography variant="h5" fontWeight={800} mb={1.5}>
            Consistency Over Intensity
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={1}>
            The most important rule is simple: stick to your schedule. Miss
            less, and your results improve month after month.
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2}>
            BurpeePacer Pro is built for this exact goal: track every workout,
            keep your streak visible, and stay accountable to your plan.
          </Typography>
          <Chip
            label="Free for 30 days for all users"
            sx={{
              mb: 2.5,
              bgcolor: "rgba(0,229,255,0.12)",
              color: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(0,229,255,0.35)",
              fontWeight: 800,
              alignSelf: "flex-start",
            }}
          />
          <Typography variant="subtitle1" fontWeight={700} mb={1.2}>
            Weekly Schedule (Example)
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(7, minmax(0, 1fr))",
              },
              gap: 1,
              mb: 2,
            }}
          >
            {weeklySchedule.map((item) => (
              <Box
                key={item.day}
                sx={{
                  borderRadius: 1.5,
                  px: 1,
                  py: 1.1,
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: item.train
                    ? "rgba(255,51,102,0.55)"
                    : "rgba(255,255,255,0.18)",
                  background: item.train
                    ? "rgba(255,51,102,0.14)"
                    : "rgba(255,255,255,0.03)",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color={item.train ? "primary.main" : "text.secondary"}
                >
                  {item.day}
                </Typography>
                <Typography
                  variant="caption"
                  color={
                    item.train ? "rgba(255,255,255,0.9)" : "text.secondary"
                  }
                >
                  {item.train ? "Train" : "Recover"}
                </Typography>
              </Box>
            ))}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Chip label="Follow the schedule" color="secondary" />
            <Chip label="Track every session" color="primary" />
            <Chip
              label="Pro helps you stay consistent"
              sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "white" }}
            />
          </Stack>
        </Card>

        <Grid container spacing={3}>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3.5,
                border: "1px solid rgba(0,229,255,0.35)",
                height: "100%",
              }}
            >
              <Typography
                variant="h5"
                fontWeight={800}
                mb={1.5}
                color="secondary.main"
              >
                Burpee Without Push-up
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                Best for beginners, high-volume days, and steady conditioning.
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                Lower upper-body fatigue and faster reps make it easier to
                maintain pace.
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={2.5}>
                Good choice when your goal is consistency and daily completion.
              </Typography>
            </Card>
          </Grid>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3.5,
                border: "1px solid rgba(255,51,102,0.45)",
                height: "100%",
              }}
            >
              <Typography
                variant="h5"
                fontWeight={800}
                mb={1.5}
                color="primary.main"
              >
                Burpee With Push-up
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                Adds chest, triceps, and shoulder strength with each rep.
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                Increases time-under-tension and difficulty, useful for
                progressive overload.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Better for intermediate and advanced athletes who want a harder
                full-body stimulus.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
