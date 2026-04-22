"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, missingFirebaseEnvVars } from "../lib/firebase";
import { useRouter } from "next/navigation";

// After a user signs up or logs in, check if they paid before creating an account
// and automatically link the pending advanced subscription to their new Firebase user.
// This calls a server-side API route so the client never writes subscription fields
// directly to Firestore (those fields are protected by security rules).
async function claimPendingSubscription(uid: string, email: string) {
  try {
    await fetch("/api/claim-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email }),
    });
  } catch (err) {
    console.error("Failed to claim pending subscription:", err);
  }
}

interface LoginProps {
  onBackToInfo?: () => void;
}

export default function Login({ onBackToInfo }: LoginProps) {
  const router = useRouter();
  // Default to Sign Up if the user just completed a Stripe payment as a guest
  const isSignupFlow =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("signup") === "1";
  const [isLogin, setIsLogin] = useState(!isSignupFlow);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    isSignupFlow
      ? "🎉 Payment successful! Create your account below to activate your advanced access."
      : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (!auth) {
      setError(
        `Firebase is not configured in this deployment. Missing env vars: ${missingFirebaseEnvVars.join(", ")}`,
      );
      return;
    }
    try {
      let credential;
      if (isLogin) {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        fetch("/api/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: credential.user.uid, email }),
        }).catch(() => {});
      }

      // If the user paid via Stripe before creating an account, link the
      // pending advanced subscription to their new Firebase account now.
      await claimPendingSubscription(credential.user.uid, email);

      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      const destination = nextPath && nextPath.startsWith("/") ? nextPath : "/";
      router.push(destination);
      // Keep loading state active — the page will navigate away
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        setError(
          "Incorrect email or password. If you haven't signed up yet, click \"Don't have an account? Sign up\" below.",
        );
      } else if (code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up first.");
      } else if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError((err as Error).message);
      }
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");
    if (!auth) return;
    if (!email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        {onBackToInfo && (
          <Button
            variant="text"
            size="small"
            onClick={onBackToInfo}
            sx={{ mb: 1.5 }}
          >
            Back to info
          </Button>
        )}
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          color="primary"
          fontWeight={800}
        >
          {isLogin ? "Welcome Back" : "Create Account"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          mb={3}
        >
          Sync your progress between the website and your phone.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleAuth}>
          {!isLogin && (
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.78)", mb: 0.75, fontWeight: 600 }}
                >
                  First Name *
                </Typography>
                <TextField
                  type="text"
                  fullWidth
                  required
                  disabled={isLoading}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-label="First Name"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.35)" },
                      "&.Mui-focused fieldset": { borderColor: "primary.main" },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.78)", mb: 0.75, fontWeight: 600 }}
                >
                  Last Name *
                </Typography>
                <TextField
                  type="text"
                  fullWidth
                  required
                  disabled={isLoading}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-label="Last Name"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.35)" },
                      "&.Mui-focused fieldset": { borderColor: "primary.main" },
                    },
                  }}
                />
              </Box>
            </Box>
          )}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.78)",
                mb: 0.75,
                fontWeight: 600,
              }}
            >
              Email *
            </Typography>
            <TextField
              type="email"
              fullWidth
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.35)",
                  },
                  "&.Mui-focused fieldset": { borderColor: "primary.main" },
                },
              }}
            />
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.78)",
                mb: 0.75,
                fontWeight: 600,
              }}
            >
              Password *
            </Typography>
            <TextField
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.35)",
                  },
                  "&.Mui-focused fieldset": { borderColor: "primary.main" },
                },
              }}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isLogin ? "Sign In" : "Sign Up"
            )}
          </Button>
        </form>

        {isLogin && (
          <Box display="flex" justifyContent="center" mb={1} mt={1}>
            <Button variant="text" size="small" onClick={handleResetPassword}>
              Forgot Password?
            </Button>
          </Box>
        )}

        <Button
          fullWidth
          variant="text"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setMessage("");
            setFirstName("");
            setLastName("");
          }}
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Button>
      </Card>
    </Box>
  );
}
