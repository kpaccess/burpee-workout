"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";

interface BurpeeFormGuideProps {
  isActive: boolean;
  secondsToNextRep: number | null;
}

const BURPEE_STEPS = [
  {
    step: 1,
    title: "Stand Tall",
    description: "Feet shoulder-width apart",
    svgPath: (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        {/* Head */}
        <circle cx="50" cy="15" r="8" fill="#FF3366" />
        {/* Body */}
        <line x1="50" y1="23" x2="50" y2="50" stroke="#FF3366" strokeWidth="3" />
        {/* Arms */}
        <line x1="50" y1="30" x2="30" y2="20" stroke="#FF3366" strokeWidth="2" />
        <line x1="50" y1="30" x2="70" y2="20" stroke="#FF3366" strokeWidth="2" />
        {/* Legs */}
        <line x1="50" y1="50" x2="40" y2="100" stroke="#FF3366" strokeWidth="3" />
        <line x1="50" y1="50" x2="60" y2="100" stroke="#FF3366" strokeWidth="3" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Squat Down",
    description: "Lower hips, place hands on ground",
    svgPath: (
      <svg viewBox="0 0 100 120" className="w-full h-auto">
        {/* Head */}
        <circle cx="50" cy="25" r="8" fill="#FF3366" />
        {/* Body (bent) */}
        <line x1="50" y1="33" x2="45" y2="55" stroke="#FF3366" strokeWidth="3" />
        {/* Arms reaching down */}
        <line x1="45" y1="40" x2="35" y2="60" stroke="#FF3366" strokeWidth="2" />
        <line x1="45" y1="40" x2="55" y2="60" stroke="#FF3366" strokeWidth="2" />
        {/* Hands on ground */}
        <circle cx="35" cy="62" r="3" fill="#FF3366" />
        <circle cx="55" cy="62" r="3" fill="#FF3366" />
        {/* Legs (bent) */}
        <line x1="50" y1="55" x2="40" y2="95" stroke="#FF3366" strokeWidth="3" />
        <line x1="50" y1="55" x2="60" y2="95" stroke="#FF3366" strokeWidth="3" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Jump Back",
    description: "Extend legs, prepare for push-up",
    svgPath: (
      <svg viewBox="0 0 100 120" className="w-full h-auto">
        {/* Head */}
        <circle cx="40" cy="20" r="8" fill="#FF3366" />
        {/* Body (horizontal) */}
        <line x1="40" y1="28" x2="50" y2="38" stroke="#FF3366" strokeWidth="3" />
        {/* Arms supporting */}
        <line x1="40" y1="30" x2="30" y2="50" stroke="#FF3366" strokeWidth="2" />
        <line x1="50" y1="38" x2="60" y2="50" stroke="#FF3366" strokeWidth="2" />
        {/* Hands on ground */}
        <circle cx="30" cy="52" r="3" fill="#FF3366" />
        <circle cx="60" cy="52" r="3" fill="#FF3366" />
        {/* Legs extended back */}
        <line x1="50" y1="38" x2="55" y2="90" stroke="#FF3366" strokeWidth="3" />
        <line x1="50" y1="38" x2="65" y2="90" stroke="#FF3366" strokeWidth="3" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "Push-Up",
    description: "Lower chest to ground (optional)",
    svgPath: (
      <svg viewBox="0 0 100 120" className="w-full h-auto">
        {/* Head near ground */}
        <circle cx="45" cy="35" r="8" fill="#FF3366" />
        {/* Body (flat, lowered) */}
        <line x1="45" y1="43" x2="52" y2="50" stroke="#FF3366" strokeWidth="3" />
        {/* Arms bent */}
        <line x1="45" y1="45" x2="32" y2="55" stroke="#FF3366" strokeWidth="2" />
        <line x1="52" y1="50" x2="65" y2="55" stroke="#FF3366" strokeWidth="2" />
        {/* Hands on ground */}
        <circle cx="32" cy="57" r="3" fill="#FF3366" />
        <circle cx="65" cy="57" r="3" fill="#FF3366" />
        {/* Legs extended */}
        <line x1="52" y1="50" x2="58" y2="95" stroke="#FF3366" strokeWidth="3" />
        <line x1="52" y1="50" x2="68" y2="95" stroke="#FF3366" strokeWidth="3" />
      </svg>
    ),
  },
  {
    step: 5,
    title: "Jump Forward",
    description: "Bring knees to chest",
    svgPath: (
      <svg viewBox="0 0 100 120" className="w-full h-auto">
        {/* Head */}
        <circle cx="50" cy="22" r="8" fill="#FF3366" />
        {/* Body (returning) */}
        <line x1="50" y1="30" x2="50" y2="48" stroke="#FF3366" strokeWidth="3" />
        {/* Arms up */}
        <line x1="50" y1="32" x2="32" y2="25" stroke="#FF3366" strokeWidth="2" />
        <line x1="50" y1="32" x2="68" y2="25" stroke="#FF3366" strokeWidth="2" />
        {/* Legs bent (knees to chest) */}
        <line x1="50" y1="48" x2="45" y2="75" stroke="#FF3366" strokeWidth="3" />
        <line x1="50" y1="48" x2="55" y2="75" stroke="#FF3366" strokeWidth="3" />
        {/* Ground position */}
        <line x1="40" y1="100" x2="60" y2="100" stroke="#999" strokeWidth="1" />
      </svg>
    ),
  },
  {
    step: 6,
    title: "Stand & Repeat",
    description: "Return to standing position",
    svgPath: (
      <svg viewBox="0 0 100 120" className="w-full h-auto">
        {/* Head */}
        <circle cx="50" cy="15" r="8" fill="#FF3366" />
        {/* Body */}
        <line x1="50" y1="23" x2="50" y2="50" stroke="#FF3366" strokeWidth="3" />
        {/* Arms up celebration */}
        <line x1="50" y1="30" x2="28" y2="15" stroke="#FF3366" strokeWidth="2" />
        <line x1="50" y1="30" x2="72" y2="15" stroke="#FF3366" strokeWidth="2" />
        {/* Legs */}
        <line x1="50" y1="50" x2="40" y2="100" stroke="#FF3366" strokeWidth="3" />
        <line x1="50" y1="50" x2="60" y2="100" stroke="#FF3366" strokeWidth="3" />
      </svg>
    ),
  },
];

export default function BurpeeFormGuide({
  isActive,
  secondsToNextRep,
}: BurpeeFormGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive || secondsToNextRep === null) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % BURPEE_STEPS.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isActive, secondsToNextRep]);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
    }
  }, [isActive]);

  const step = BURPEE_STEPS[currentStep];

  return (
    <Box
      sx={{
        p: 3,
        textAlign: "center",
        background: "rgba(255, 51, 102, 0.08)",
        borderRadius: 2,
        border: "1px solid rgba(255, 51, 102, 0.2)",
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        FORM GUIDE
      </Typography>

      <Box key={currentStep}>
        <Box sx={{ height: 120, mb: 2, display: "flex", alignItems: "center" }}>
          {step.svgPath}
        </Box>

        <Typography variant="h6" fontWeight={800} mb={0.5} color="primary.main">
          {step.step}. {step.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          {step.description}
        </Typography>

        {isActive && secondsToNextRep !== null && (
          <Typography variant="caption" color="secondary.main" fontWeight={700}>
            Next rep in {secondsToNextRep}s
          </Typography>
        )}
      </Box>

      {!isActive && (
        <Typography variant="body2" color="text.secondary">
          Start your timer to see the form guide in action
        </Typography>
      )}
    </Box>
  );
}
