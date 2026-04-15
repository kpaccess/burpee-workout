"use client";

import React, { useState } from "react";
import {
  Alert,
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

const PRO_FEATURES = [
  "Full calendar history (all time)",
  "Export workout data (CSV)",
  "Advanced workout timer with intervals",
  "Priority support",
];

const BEGINNER_FEATURES = [
  "Beginner workout track",
  "Included in 60-day launch free access",
  "Placeholder video area for your future content",
  "Core progress tracking",
];

export default function PricingPage() {
  const { user } = useAuth();
  const { isPro, isTrialing, trialEndsAt, stripeCustomerId, loading } =
    useSubscription(user?.uid ?? null, user?.email);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const isPaidSubscriber = isPro && !isTrialing;
  const formattedTrialEnd = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString()
    : null;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();
  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login?next=/pricing");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass user credentials if logged in; guests pay first and sign up after
        body: JSON.stringify({
          userId: user?.uid ?? null,
          userEmail: user?.email ?? null,
        }),
      });
      const { url, error } = await res.json();
      if (!res.ok) throw new Error(error ?? "Unable to start checkout");
      if (error) throw new Error(error);
      if (!url) throw new Error("Missing Stripe checkout URL");
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutLoading(false);
      const message = err instanceof Error ? err.message : String(err);
      setCheckoutError(message);
    }
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      const { url, error } = await res.json();
      if (!res.ok) throw new Error(error ?? "Unable to open billing portal");
      if (error) throw new Error(error);
      if (!url) throw new Error("Missing Stripe portal URL");
      window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
      setPortalLoading(false);
      const message = err instanceof Error ? err.message : String(err);
      setPortalError(message);
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
            Workout Tracks
          </Typography>
          <Typography variant="h6" color="grey.400">
            All users get 60-day launch free access from their start date.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Card
            sx={{
              borderRadius: 3,
              background: "rgba(0,229,255,0.08)",
              border: "1px solid rgba(0,229,255,0.35)",
              backdropFilter: "blur(10px)",
              width: "100%",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Chip
                label="BEGINNER"
                size="small"
                sx={{
                  mb: 2,
                  background: "rgba(0,229,255,0.18)",
                  color: "white",
                  fontWeight: 700,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Typography variant="h3" fontWeight={800} color="white">
                  Free
                </Typography>
              </Box>
              <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>
                Available during launch free period
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 3 }} />
              <List dense disablePadding>
                {BEGINNER_FEATURES.map((feature) => (
                  <ListItem key={feature} disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon
                        sx={{ color: "#00E5FF", fontSize: 20 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{ color: "white", fontSize: 15 }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => router.push(user ? "/" : "/login")}
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: 15,
                  borderRadius: 2,
                  color: "white",
                  borderColor: "rgba(0,229,255,0.4)",
                }}
              >
                {user ? "Use Beginner Track" : "Sign in for Beginner"}
              </Button>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.15) 100%)",
              border: "2px solid rgba(245,158,11,0.5)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "visible",
              width: "100%",
            }}
          >
            <Chip
              label="ADVANCED"
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
                px: 1,
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  mt: 1,
                  mb: 0.5,
                }}
              >
                <Typography variant="h3" fontWeight={800} color="white">
                  $4.99
                </Typography>
                <Typography variant="body1" color="grey.400">
                  / month
                </Typography>
              </Box>
              <Typography variant="body2" color="grey.500" sx={{ mb: 3 }}>
                Paid subscription
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 3 }} />
              <List dense disablePadding>
                {PRO_FEATURES.map((f) => (
                  <ListItem key={f} disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon
                        sx={{ color: "#f59e0b", fontSize: 20 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={f}
                      primaryTypographyProps={{
                        color: "white",
                        fontSize: 15,
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
                    label={
                      isTrialing ? "✓ Trial active" : "✓ Advanced unlocked"
                    }
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
                  {isTrialing && formattedTrialEnd && (
                    <Typography
                      variant="body2"
                      color="grey.400"
                      sx={{ mt: 1.5, textAlign: "center" }}
                    >
                      Trial ends on {formattedTrialEnd}
                    </Typography>
                  )}

                  {isTrialing && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      sx={{
                        mt: 1.5,
                        borderColor: "rgba(255,255,255,0.25)",
                        color: "white",
                      }}
                    >
                      {checkoutLoading ? "Redirecting..." : "Subscribe now"}
                    </Button>
                  )}

                  {isPaidSubscriber && stripeCustomerId && (
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
                  {portalError && (
                    <Alert severity="error" sx={{ mt: 1.5 }}>
                      {portalError}
                    </Alert>
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
                      ? "Unlock Advanced"
                      : "Sign in to unlock Advanced"}
                </Button>
              )}
              {checkoutError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {checkoutError}
                </Alert>
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
            Advanced features and premium content require a paid subscription
            after your 60-day launch free access ends.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
