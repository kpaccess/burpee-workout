'use client';

import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5s
    const timer = setTimeout(() => router.push('/'), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        textAlign: 'center',
        px: 2,
      }}
    >
      <CheckCircleOutlineIcon sx={{ fontSize: 80, color: '#f59e0b' }} />
      <Typography variant="h4" fontWeight={800} color="white">
        Welcome to Pro! 🎉
      </Typography>
      <Typography variant="body1" color="grey.400" maxWidth={400}>
        Your subscription is active. All Pro features are now unlocked. Redirecting you back...
      </Typography>
      <Button
        variant="contained"
        onClick={() => router.push('/')}
        sx={{
          mt: 2,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          fontWeight: 700,
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
}
