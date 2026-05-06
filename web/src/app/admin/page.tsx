"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/allowlist";
import type { AdminStats, UserRow } from "@/app/api/admin/stats/route";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StarIcon from "@mui/icons-material/Star";

interface AllowlistEntry {
  email: string;
  addedAt: string;
  addedBy: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Allowlist state
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [allowlistLoading, setAllowlistLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [removeLoadingEmail, setRemoveLoadingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin(user.email)) {
      router.replace("/");
      return;
    }

    async function fetchStats() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: AdminStats = await res.json();
        data.users = data.users ?? [];
        data.dailyViews = data.dailyViews ?? {};
        setStats(data);
      } catch (e) {
        setError(String(e));
      }
    }

    async function fetchAllowlist() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch("/api/admin/allowlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAllowlist(data.emails ?? []);
      } catch {
        // Non-fatal — allowlist section shows empty state
      } finally {
        setAllowlistLoading(false);
      }
    }

    fetchStats();
    fetchAllowlist();
  }, [user, loading, router]);

  const handleAddEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);

    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add email");
        return;
      }
      setAllowlist((prev) => [
        { email: trimmed, addedAt: new Date().toISOString(), addedBy: user!.email ?? "admin" },
        ...prev,
      ]);
      setNewEmail("");
      setAddSuccess(
        data.grantedExistingUser
          ? `${trimmed} added and granted Pro access immediately.`
          : `${trimmed} added. They'll get Pro access when they sign up.`
      );
    } catch {
      setAddError("Network error — please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    setRemoveLoadingEmail(email);
    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/allowlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to remove email");
        return;
      }
      setAllowlist((prev) => prev.filter((e) => e.email !== email));
    } catch {
      alert("Network error — please try again.");
    } finally {
      setRemoveLoadingEmail(null);
    }
  };

  if (loading || (!stats && !error)) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">Failed to load stats: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 8 },
        background: "#0a0a0a",
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/")}
        sx={{ mb: 3, color: "text.secondary" }}
      >
        Back to app
      </Button>
      <Typography variant="h4" fontWeight={900} mb={1}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={5}>
        Site-wide analytics — visible only to you.
      </Typography>

      {/* Stat cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0,1fr))" },
          gap: 3,
          maxWidth: 480,
          mb: 6,
        }}
      >
        <StatCard
          icon={<VisibilityIcon sx={{ fontSize: 40, color: "secondary.main" }} />}
          label="Total Visitors"
          value={stats!.pageViews}
        />
        <StatCard
          icon={<PeopleAltIcon sx={{ fontSize: 40, color: "primary.main" }} />}
          label="Total Sign-ups"
          value={stats!.signupCount}
        />
      </Box>

      {/* ── Allowlist Management ─────────────────────────────────────── */}
      <Box sx={{ mb: 6 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <StarIcon sx={{ color: "warning.main", fontSize: 22 }} />
          <Typography variant="h6" fontWeight={800}>
            Free Pro Access (Allowlist)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Emails added here get free Pro access. If they already have an account, access is granted immediately.
          Otherwise it activates when they sign up.
        </Typography>

        {/* Add email form */}
        <Box
          component="form"
          onSubmit={(e) => { e.preventDefault(); handleAddEmail(); }}
          sx={{ display: "flex", gap: 1.5, mb: 2, maxWidth: 500 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="friend@example.com"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setAddError(null);
              setAddSuccess(null);
            }}
            disabled={addLoading}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonAddAltIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.04)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="warning"
            disabled={addLoading || !newEmail.trim()}
            sx={{ whiteSpace: "nowrap", fontWeight: 700, minWidth: 100 }}
          >
            {addLoading ? <CircularProgress size={18} color="inherit" /> : "Add Email"}
          </Button>
        </Box>

        {addError && <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>{addError}</Alert>}
        {addSuccess && <Alert severity="success" sx={{ mb: 2, maxWidth: 500 }}>{addSuccess}</Alert>}

        {/* Allowlist table */}
        <TableContainer component={Paper} sx={{ bgcolor: "#141414", maxWidth: 700 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCell}>Email</TableCell>
                <TableCell sx={headerCell}>Added</TableCell>
                <TableCell sx={headerCell}>Added By</TableCell>
                <TableCell sx={headerCell} align="center">Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allowlistLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              ) : allowlist.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="caption" color="text.disabled">
                      No emails in the allowlist yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                allowlist.map((entry) => (
                  <TableRow key={entry.email} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{entry.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 12, whiteSpace: "nowrap" }}>
                      {formatDate(entry.addedAt)}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                      {entry.addedBy}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove from allowlist">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={removeLoadingEmail === entry.email}
                            onClick={() => handleRemoveEmail(entry.email)}
                          >
                            {removeLoadingEmail === entry.email
                              ? <CircularProgress size={16} color="inherit" />
                              : <DeleteOutlineIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ mb: 6, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Daily views */}
      <Typography variant="h6" fontWeight={800} mb={2}>
        Visits by Day
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: "#141414", mb: 6, maxWidth: 400 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Date</TableCell>
              <TableCell sx={headerCell} align="right">Views</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(stats!.dailyViews ?? {})
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, count]) => (
                <TableRow key={date} hover>
                  <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{date}</TableCell>
                  <TableCell align="right">{count}</TableCell>
                </TableRow>
              ))}
            {Object.keys(stats!.dailyViews ?? {}).length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="caption" color="text.disabled">
                    No daily data yet — will accumulate from new visits.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Users table */}
      <Typography variant="h6" fontWeight={800} mb={2}>
        Users
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: "#141414" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                "#", "First Name", "Last Name", "Email", "Joined", "Last Login",
                "Tier", "Level", "Day", "Workouts", "Timer Verified", "Onboarded", "Pro",
              ].map((h) => (
                <TableCell key={h} sx={headerCell}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stats!.users.map((u: UserRow) => (
              <TableRow key={u.email} hover>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>{u.serialNo}</TableCell>
                <TableCell>{u.firstName || <Typography variant="caption" color="text.disabled">—</Typography>}</TableCell>
                <TableCell>{u.lastName || <Typography variant="caption" color="text.disabled">—</Typography>}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: 12 }}>
                  {formatDate(u.created)}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: 12 }}>
                  {u.lastLogin === "Never" ? "Never" : formatDate(u.lastLogin)}
                </TableCell>
                <TableCell>
                  {u.tier ? (
                    <Chip label={u.tier} size="small" color={u.tier === "beginner" ? "success" : "info"} sx={{ fontSize: 11 }} />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.level || "—"}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: 12 }}>
                  {getCurrentDay(u.startDate)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {u.workoutsCompleted > 0 ? u.workoutsCompleted : "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  {u.timerVerified > 0 ? (
                    <Chip label={u.timerVerified} size="small" color="success" sx={{ fontSize: 11 }} />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.onboarded ? "Yes" : "No"}
                    size="small"
                    color={u.onboarded ? "success" : "default"}
                    sx={{ fontSize: 11 }}
                  />
                </TableCell>
                <TableCell>
                  {u.isPro ? (
                    <Chip label="Pro" size="small" color="warning" sx={{ fontSize: 11 }} />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const headerCell = (theme: import("@mui/material").Theme) => ({
  fontWeight: theme.typography.fontWeightBold,
  color: "text.secondary",
});

// ── Helper components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card sx={{ p: 4, textAlign: "center" }}>
      {icon}
      <Typography variant="h3" fontWeight={900} mt={1}>
        {value.toLocaleString()}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        {label}
      </Typography>
    </Card>
  );
}

// ── Utility functions ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentDay(startDate: string): string {
  if (!startDate) return "—";
  const diffMs = Date.now() - new Date(startDate).getTime();
  const day = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  if (day < 1 || day > 60) return "—";
  return `Day ${day}`;
}
