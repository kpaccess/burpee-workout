"use client";

import React, { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import BoltIcon from "@mui/icons-material/Bolt";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import BurpeeLogoIcon from "@/components/BurpeeLogoIcon";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/analytics/visit", { method: "POST" }).catch(() => {});
  }, []);
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
          <Stack
            spacing={2}
            alignItems={{ xs: "center", md: "flex-start" }}
            mb={5}
          >
            <BurpeeLogoIcon size={56} />
            <Typography
              variant="h2"
              sx={{
                width: "100%",
                fontWeight: 900,
                lineHeight: 1.05,
                maxWidth: 780,
                mx: { xs: "auto", md: 0 },
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Burpees: Simple, Brutal,
              <Box component="span" sx={{ color: "primary.main" }}>
                {" "}
                and Proven
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                width: "100%",
                maxWidth: 760,
                mx: { xs: "auto", md: 0 },
                color: "rgba(255,255,255,0.76)",
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Start with 60-day free access for all users, then continue with
              the plan that fits you. Both tracks are built around simple,
              consistent burpee training.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                width: "100%",
                maxWidth: 760,
                mx: { xs: "auto", md: 0 },
                color: "rgba(255,255,255,0.86)",
                fontWeight: 600,
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Consistency is the real secret. Follow your schedule, show up on
              your training days, and progress compounds.
            </Typography>
            <Box
              sx={{
                width: "100%",
                maxWidth: 760,
                mx: { xs: "auto", md: 0 },
                px: 2,
                py: 1.5,
                borderRadius: 2,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                textAlign: { xs: "center", md: "left" },
              }}
            >
              <Typography
                variant="body2"
                color="rgba(255,255,255,0.92)"
                fontWeight={700}
              >
                Inspired by the Busy Dad Program by Busy Dad Training.
              </Typography>
              <Typography
                variant="body2"
                color="rgba(255,255,255,0.72)"
                sx={{ mt: 0.5 }}
              >
                This app is an independent project and is not affiliated with or
                endorsed by Busy Dad Training.
              </Typography>
            </Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              pt={1}
              alignItems={{ xs: "center", sm: "stretch" }}
              sx={{
                width: "100%",
                maxWidth: 760,
                mx: { xs: "auto", md: 0 },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<WorkspacePremiumIcon />}
                onClick={() => router.push("/login")}
              >
                Start 60-Day Free Access
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push("/pricing")}
              >
                See Advanced Pricing
              </Button>
              <Button
                variant="text"
                size="large"
                onClick={() => router.push("/login")}
                sx={{ color: "rgba(255,255,255,0.76)" }}
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
            Many people plan to walk outside, but weather changes - rain, cold,
            or darkness can break the routine. Burpees at home remove that
            barrier. No equipment, little space, anytime in 20 minutes.
          </Typography>
          <Chip
            label="60-day launch free access"
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
            <Chip label="60-day launch free access" color="primary" />
            <Chip
              label="Advanced unlocks premium coaching"
              sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "white" }}
            />
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 3,
            mb: 3,
          }}
        >
          <Card sx={{ p: 3.5, border: "1px solid rgba(0,229,255,0.35)" }}>
            <Typography
              variant="h5"
              fontWeight={800}
              mb={1}
              color="secondary.main"
            >
              Beginner
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={1}>
              Included in your 60-day launch free access. Use it to build
              consistency and learn movement quality.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Best for people starting out or anyone who wants a no-cost entry
              point.
            </Typography>
          </Card>
          <Card sx={{ p: 3.5, border: "1px solid rgba(245,158,11,0.45)" }}>
            <Typography
              variant="h5"
              fontWeight={800}
              mb={1}
              color="warning.main"
            >
              Advanced
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={1}>
              Paid track with premium workout content, advanced tutorials, and
              subscription-backed features.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is the only track that carries charges.
            </Typography>
          </Card>
        </Box>

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
              <Button
                variant="outlined"
                component="a"
                href="https://www.youtube.com/shorts/O9E5BSf2l1Q"
                target="_blank"
                rel="noreferrer"
              >
                Watch simple demo
              </Button>
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

        <Alert
          severity="warning"
          sx={{ mt: 4, borderRadius: 2 }}
          icon={false}
        >
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            ⚠️ Please read before you begin
          </Typography>
          <Typography variant="body2">
            I am not a coach or medical professional. Please consult your
            doctor before starting any exercise program. Always start from the
            very beginning, progress gradually day by day, and only do the
            burpees you are capable of — strive for a little more each day. It
            is perfectly fine to stay at one level and get fit there; advancing
            through levels is never required.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}
