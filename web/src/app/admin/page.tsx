"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/allowlist";
import type { AdminStats, UserRow } from "@/app/api/admin/stats/route";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        // Ensure users array always exists
        data.users = data.users ?? [];
        setStats(data);
      } catch (e) {
        setError(String(e));
      }
    }

    fetchStats();
  }, [user, loading, router]);

  if (loading || (!stats && !error)) {
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

      {/* Users table */}
      <Typography variant="h6" fontWeight={800} mb={2}>
        Users
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: "#141414" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>#</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>First Name</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Last Name</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Email</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Joined</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Last Login</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Tier</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Level</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Onboarded</TableCell>
              <TableCell sx={(theme) => ({ fontWeight: theme.typography.fontWeightBold, color: "text.secondary" })}>Pro</TableCell>
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
                    <Chip
                      label={u.tier}
                      size="small"
                      color={u.tier === "beginner" ? "success" : "info"}
                      sx={{ fontSize: 11 }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.level || "—"}</Typography>
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
