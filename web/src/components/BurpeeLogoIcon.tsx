import React from "react";

interface BurpeeLogoIconProps {
  size?: number;
  color?: string;
}

// Silhouette of a person mid-burpee (jump phase: arms overhead, knees bent, airborne)
export default function BurpeeLogoIcon({
  size = 56,
  color = "#FF3366",
}: BurpeeLogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Person doing a burpee"
      role="img"
    >
      {/* Head */}
      <circle cx="32" cy="8" r="5" fill={color} />

      {/* Body */}
      <line
        x1="32"
        y1="13"
        x2="32"
        y2="34"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Left arm raised */}
      <line
        x1="32"
        y1="18"
        x2="18"
        y2="9"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Right arm raised */}
      <line
        x1="32"
        y1="18"
        x2="46"
        y2="9"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Left leg (bent, jumping) */}
      <line
        x1="32"
        y1="34"
        x2="22"
        y2="46"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="22"
        y1="46"
        x2="26"
        y2="56"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Right leg (bent, jumping) */}
      <line
        x1="32"
        y1="34"
        x2="42"
        y2="46"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="46"
        x2="38"
        y2="56"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
