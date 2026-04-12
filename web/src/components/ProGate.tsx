'use client';

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useRouter } from 'next/navigation';

interface ProGateProps {
  children: React.ReactNode;
  isPro: boolean;
  featureName?: string;
}

/**
 * Wraps a feature and shows a locked overlay if the user is not Pro.
 * Usage: <ProGate isPro={isPro} featureName="Full Calendar History">...</ProGate>
 */
export default function ProGate({ children, isPro, featureName = 'This feature' }: ProGateProps) {
  const router = useRouter();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      {/* Blurred preview */}
      <Box sx={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
        {children}
      </Box>

      {/* Lock overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          borderRadius: 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 3,
            textAlign: 'center',
            maxWidth: 280,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <LockIcon sx={{ fontSize: 36, color: 'warning.light', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={700} color="white" gutterBottom>
            {featureName}
          </Typography>
          <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
            Unlock with BurpeePacer Pro
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<WorkspacePremiumIcon />}
            onClick={() => router.push('/pricing')}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706, #dc2626)',
              },
            }}
          >
            Upgrade to Pro
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
