import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

const defaultProps = {
  size: 24,
  color: 'currentColor',
};

export function WaterIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5.5 9.5 5.5 14.5a6.5 6.5 0 0013 0C18.5 9.5 12 2 12 2z" />
    </svg>
  );
}

export function CoffeeIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h12l-1.5 10a2 2 0 01-2 1.5H8.5A2 2 0 016.5 18L5 8z" />
      <path d="M17 10h1.5a2.5 2.5 0 010 5H17" />
      <line x1="4" y1="22" x2="20" y2="22" />
    </svg>
  );
}

export function EnergyIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13,2 5,14 11,14 10,22 19,9 13,9" fill={color} stroke="none" />
    </svg>
  );
}

export function TeaIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9h10l-1.5 9a1.5 1.5 0 01-1.5 1.5h-4A1.5 1.5 0 018.5 18L7 9z" />
      <path d="M17 11h1.5a1.5 1.5 0 010 3H17" />
      <path d="M9 6.5c0-1.5 2-1.5 2-3" />
      <path d="M13 6.5c0-1.5 2-1.5 2-3" />
    </svg>
  );
}

export function JuiceIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8l-1.5 15a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 018.5 19L7 4z" />
      <line x1="13" y1="4" x2="11" y2="19.5" strokeDasharray="2 1.5" />
    </svg>
  );
}

export function SodaIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="4" width="10" height="16" rx="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
      <circle cx="10.5" cy="12" r="0.8" fill={color} stroke="none" />
      <circle cx="13.5" cy="10" r="0.8" fill={color} stroke="none" />
      <circle cx="12" cy="14.5" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}

export function ElectrolyteIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

export function AlcoholIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8l-2 9h-4L8 3z" />
      <line x1="12" y1="12" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  );
}

export function CameraIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <circle cx="12" cy="14" r="4" />
      <path d="M8 8l1.5-3h5L16 8" />
    </svg>
  );
}

export function MenuIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function BackIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function BrainIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.5C7 4.5 5 6.5 5 9c0 1.5.7 2.8 1.8 3.6v1.9h10.4v-1.9C18.3 11.8 19 10.5 19 9c0-2.5-2-4.5-4.5-4.5H9.5z" />
      <path d="M6.8 14.5v5" />
      <path d="M17.2 14.5v5" />
      <line x1="6.8" y1="19.5" x2="17.2" y2="19.5" />
    </svg>
  );
}

export function ActivityIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="4" r="2" />
      <path d="M11 9l-3 10" />
      <path d="M8 19l4-4 2 3" />
      <path d="M11 12l3 2 3-5" />
    </svg>
  );
}

export function FlaskIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Liquid fill inside flask */}
      <path d="M7.2 16.5 C6.2 18 5.8 19 5 20h14c-0.8-1-1.2-2-2.2-3.5 C15.4 14.8 15 13.5 15 11H9c0 2.5-0.4 3.8-1.8 5.5z" fill={color} stroke="none" opacity={0.35} />
      {/* Flask outline */}
      <path d="M9 3h6v8l4 9H5l4-9V3z" />
      <line x1="9" y1="3" x2="15" y2="3" />
    </svg>
  );
}

export function SunIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
      <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
      <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
      <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
    </svg>
  );
}

export function StarIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

export function ClockIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12,7 12,12 15,15" />
    </svg>
  );
}

export function CheckIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export function XIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Scan frame with water drop in the center
export function ScanDrinkIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Corner brackets — scan frame */}
      {/* Top-left */}
      <path d="M3 8V4h4" stroke={color} strokeWidth={1.8} />
      {/* Top-right */}
      <path d="M21 8V4h-4" stroke={color} strokeWidth={1.8} />
      {/* Bottom-left */}
      <path d="M3 16v4h4" stroke={color} strokeWidth={1.8} />
      {/* Bottom-right */}
      <path d="M21 16v4h-4" stroke={color} strokeWidth={1.8} />
      {/* Water drop in center */}
      <path d="M12 7.5c0 0-3.5 3.8-3.5 6a3.5 3.5 0 007 0c0-2.2-3.5-6-3.5-6z" fill={color} stroke="none" />
    </svg>
  );
}

export function BeerIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h12l-1.2 9.5a1.5 1.5 0 01-1.5 1.3H7.7a1.5 1.5 0 01-1.5-1.3L5 8z" />
      <path d="M17 10.5h1.5a2 2 0 010 4H17" />
      <line x1="5" y1="8" x2="17" y2="8" />
      <path d="M9 5.5c0-1.2 1.5-1.2 1.5-2.5" />
      <path d="M12.5 5.5c0-1.2 1.5-1.2 1.5-2.5" />
    </svg>
  );
}

export function HomeIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Sleek minimal home: roof chevron + body */}
      <path d="M4 11.5L12 4l8 7.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 001 1h3.5v-4h3v4H17a1 1 0 001-1v-9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChartIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clean minimal bars — filled for crispness */}
      <rect x="3.5" y="13" width="3.5" height="8" rx="1.2" fill={color} opacity="0.55" />
      <rect x="10.25" y="8" width="3.5" height="13" rx="1.2" fill={color} opacity="0.75" />
      <rect x="17" y="4" width="3.5" height="17" rx="1.2" fill={color} />
    </svg>
  );
}

export function GearIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Cleaner 6-tooth gear */}
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </svg>
  );
}

export function PersonIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-1a8 8 0 0116 0v1" />
    </svg>
  );
}

export function LockIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
      <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function TrophyIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4" />
      <path d="M6 4H3v4a4 4 0 004 4h10a4 4 0 004-4V4h-3" />
      <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
    </svg>
  );
}

// Unused default export to satisfy module conventions
export default {
  WaterIcon,
  CoffeeIcon,
  EnergyIcon,
  TeaIcon,
  JuiceIcon,
  SodaIcon,
  ElectrolyteIcon,
  AlcoholIcon,
  CameraIcon,
  MenuIcon,
  BackIcon,
  BrainIcon,
  ActivityIcon,
  FlaskIcon,
  SunIcon,
  StarIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
};
