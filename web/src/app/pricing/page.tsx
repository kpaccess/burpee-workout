"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";

const FREE_FEATURES = [
  "Track daily burpee workouts",
  "7-day workout history",
  "Basic level progress",
  "Firebase sync across devices",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Full calendar history (all time)",
  "Detailed workout analytics & trends",
  "Export workout data (CSV)",
  "Advanced workout timer with intervals",
  "Priority support",
];

export default function PricingPage() {
  const { user } = useAuth();
  const { isPro, stripeCustomerId, loading } = useSubscription(
    user?.uid ?? null,
    user?.email,
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
      setPortalLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        py: 6,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
          sx={{ color: "grey.400", mb: 4, "&:hover": { color: "white" } }}
        >
          Back to App
        </Button>

        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            BurpeePacer Pro
          </Typography>
          <Typography variant="h6" color="grey.400">
            Unlock the full program. Track every rep. Crush every milestone.
          </Typography>
        </Box>

        {/* Pricing Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {/* Free Plan */}
          <Card
            sx={{
              borderRadius: 3,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="overline" color="grey.500" fontWeight={700}>
                Free
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                color="white"
                sx={{ mt: 1, mb: 0.5 }}
              >
                $0
              </Typography>
              <Typography variant="body2" color="grey.500" sx={{ mb: 3 }}>
                Forever free
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 3 }} />
              <List dense disablePadding>
                {FREE_FEATURES.map((f) => (
                  <ListItem key={f} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon
                        sx={{ color: "success.light", fontSize: 18 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={f}
                      primaryTypographyProps={{
                        color: "grey.300",
                        fontSize: 14,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                fullWidth
                variant="outlined"
                disabled
                sx={{
                  mt: 3,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "grey.500",
                }}
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card
            sx={{
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.15) 100%)",
              border: "2px solid rgba(245,158,11,0.5)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* Popular badge */}
            <Chip
              label="MOST POPULAR"
              size="small"
              icon={
                <WorkspacePremiumIcon sx={{ fontSize: "14px !important" }} />
              }
              sx={{
                position: "absolute",
                top: -14,
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "white",
                fontWeight: 700,
                fontSize: 11,
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="overline"
                sx={{ color: "#f59e0b" }}
                fontWeight={700}
              >
                Pro
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  mt: 1,
                  mb: 0.5,
                }}
              >
                <Typography variant="h4" fontWeight={800} color="white">
                  $4.99
                </Typography>
                <Typography variant="body2" color="grey.400">
                  / month
                </Typography>
              </Box>
              <Typography variant="body2" color="grey.500" sx={{ mb: 3 }}>
                Cancel anytime
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 3 }} />
              <List dense disablePadding>
                {PRO_FEATURES.map((f) => (
                  <ListItem key={f} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon
                        sx={{ color: "#f59e0b", fontSize: 18 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={f}
                      primaryTypographyProps={{
                        color: "white",
                        fontSize: 14,
                        fontWeight: f.includes("Everything") ? 600 : 400,
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : isPro ? (
                <Box sx={{ mt: 3 }}>
                  <Chip
                    label="✓ You're on Pro"
                    sx={{
                      width: "100%",
                      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                      color: "white",
                      fontWeight: 700,
                      height: 44,
                      fontSize: 14,
                      borderRadius: 2,
                    }}
                  />
                  {stripeCustomerId && (
                    <Button
                      fullWidth
                      variant="text"
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      sx={{ mt: 1.5, color: "grey.400", fontSize: 13 }}
                    >
                      {portalLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        "Manage Billing"
                      )}
                    </Button>
                  )}
                </Box>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={
                    checkoutLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <WorkspacePremiumIcon />
                    )
                  }
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: 15,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #d97706, #dc2626)",
                    },
                  }}
                >
                  {checkoutLoading
                    ? "Redirecting..."
                    : user
                      ? "Upgrade to Pro"
                      : "Sign in & Upgrade"}
                </Button>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Trust badges */}
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: "🔒", label: "Secure payments via Stripe" },
              { icon: "↩️", label: "Cancel anytime" },
              { icon: "⚡", label: "Instant access after payment" },
            ].map(({ icon, label }) => (
              <Box
                key={label}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography variant="body2">{icon}</Typography>
                <Typography variant="body2" color="grey.500">
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Lock icon note */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 2,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <LockIcon sx={{ color: "grey.600", fontSize: 18 }} />
          <Typography variant="body2" color="grey.500">
            Features marked with a lock icon in the app require a Pro
            subscription. Your data is always yours — even if you cancel.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
