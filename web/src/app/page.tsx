'use client';

import React, { useState } from 'react';
import { useUserData } from '../hooks/useUserData';
import Onboarding from '../components/Onboarding';
import Dashboard from '../components/Dashboard';
import MilestoneCheckin from '../components/MilestoneCheckin';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function Home() {
  const { userData, isLoaded, saveUserData, clearUserData, toggleWorkoutLog } = useUserData();
  const { user, loading: authLoading, logout } = useAuth();
  const [showMilestoneCheckin, setShowMilestoneCheckin] = useState(false);

  if (!isLoaded || authLoading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!userData) {
    return <Onboarding onComplete={(d) => saveUserData(d)} />;
  }

  if (showMilestoneCheckin) {
    return (
      <MilestoneCheckin 
        onComplete={(d) => {
          saveUserData(d);
          setShowMilestoneCheckin(false);
        }}
        onCancel={() => setShowMilestoneCheckin(false)}
      />
    );
  }

  return (
    <Dashboard 
      userData={userData} 
      onClear={clearUserData} 
      onMilestoneCheckin={() => setShowMilestoneCheckin(true)} 
      onToggleWorkout={toggleWorkoutLog}
      onUpdateData={saveUserData}
    />
  );
}
