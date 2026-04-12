"use client";

import React, { useState } from "react";
import { Box, Card, Typography, TextField, Button, Alert, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { motion } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, missingFirebaseEnvVars } from "../lib/firebase";
import { useRouter } from "next/navigation";

interface LoginProps {
  onBackToInfo?: () => void;
}

export default function Login({ onBackToInfo }: LoginProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!auth) {
      setError(
        `Firebase is not configured in this deployment. Missing env vars: ${missingFirebaseEnvVars.join(", ")}`,
      );
      return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect email or password. If you haven\'t signed up yet, click "Don\'t have an account? Sign up" below.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError((err as Error).message);
      }
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
            sx={{ mt: 3, mb: 2 }}
          >
            {isLogin ? "Sign In" : "Sign Up"}
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
