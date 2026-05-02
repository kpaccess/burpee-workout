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
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, missingFirebaseEnvVars } from "../lib/firebase";
import { useRouter } from "next/navigation";

// After a user signs up or logs in, check if they paid before creating an account
// and automatically link the pending advanced subscription to their new Firebase user.
// This calls a server-side API route so the client never writes subscription fields
// directly to Firestore (those fields are protected by security rules).
async function claimPendingSubscription(uid: string, email: string) {
  try {
    const res = await fetch("/api/claim-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email }),
    });
    if (!res.ok) {
      console.warn(`Failed to claim subscription: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error("Failed to claim pending subscription:", err);
  }
}

async function sendWelcomeEmail(uid: string, email: string) {
  try {
    const res = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email }),
    });
    if (!res.ok) {
      console.warn(`Failed to send welcome email: ${res.status} ${res.statusText}`);
      return false;
    }
    const data = await res.json();
    if (!data.sent) {
      console.warn(`Welcome email not sent: ${data.reason}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error sending welcome email:", err);
    return false;
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        const emailSent = await sendWelcomeEmail(credential.user.uid, email);
        if (!emailSent) {
          console.warn("Welcome email failed to send during signup");
          setMessage(
            "Account created! We had trouble sending your welcome email — please check your inbox and spam folder.",
          );
        }
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
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setMessage(
        "If an account exists for that email, a password reset link will be sent. Check your inbox and spam folder.",
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);

    if (!auth) {
      setError(
        `Firebase is not configured. Missing env vars: ${missingFirebaseEnvVars.join(", ")}`,
      );
      setIsGoogleLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(credential)?.isNewUser ?? false;

      if (isNewUser) {
        await sendWelcomeEmail(credential.user.uid, credential.user.email!);
      }

      // Always attempt claim — safe no-op if no pending subscription exists.
      await claimPendingSubscription(credential.user.uid, credential.user.email!);

      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.push(nextPath?.startsWith("/") ? nextPath : "/");
      // Keep loading state active — page navigates away.
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        // User dismissed popup — not an error.
      } else if (code === "auth/account-exists-with-different-credential") {
        setError(
          "An account already exists with this email using a different sign-in method. Try signing in with your email and password instead.",
        );
      } else if (code === "auth/popup-blocked") {
        setError(
          "The sign-in popup was blocked by your browser. Please allow popups for this site and try again.",
        );
      } else {
        setError((err as Error).message);
      }
      setIsGoogleLoading(false);
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

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          sx={{
            mb: 2,
            borderColor: "rgba(255,255,255,0.3)",
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.05)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
              borderColor: "rgba(255,255,255,0.5)",
            },
            gap: 1.5,
          }}
          startIcon={
            isGoogleLoading ? null : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
            )
          }
        >
          {isGoogleLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Continue with Google"
          )}
        </Button>

        <Divider sx={{ mb: 2, color: "text.disabled", fontSize: "0.75rem" }}>
          or
        </Divider>

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
            <Button
              variant="text"
              size="small"
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              Forgot password?
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
