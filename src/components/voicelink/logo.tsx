"use client"

import { VL_COLORS } from "@/lib/constants"

interface LogoProps {
  size?: number
  animated?: boolean
  className?: string
}

/**
 * VoiceLink mark — circular blue→purple gradient tile with a white microphone
 * glyph (matches the official VoiceLink app icon). Breathing glow animation
 * gives it the "live" feel of a push-to-talk device.
 */
export function Logo({ size = 36, animated = true, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-label="VoiceLink"
      role="img"
    >
      <defs>
        <linearGradient id="vl-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4F6EF7" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
        <filter id="vl-logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="vl-logo-clip">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>

      {/* Circular gradient background */}
      <circle cx="32" cy="32" r="30" fill="url(#vl-logo-grad)" />
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="1"
      />

      {/* White microphone glyph with glow + optional breathing */}
      <g
        clipPath="url(#vl-logo-clip)"
        filter="url(#vl-logo-glow)"
        className={animated ? "vl-breathe" : ""}
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeWidth="3.4"
      >
        {/* Head (pill capsule) */}
        <rect x="25.5" y="15" width="13" height="22" rx="6.5" fill="#ffffff" stroke="none" />
        {/* U-curve body */}
        <path d="M 19 30 V 32 a 13 13 0 0 0 26 0 V 30" />
        {/* Stem */}
        <line x1="32" y1="45" x2="32" y2="52" />
        {/* Base */}
        <line x1="25" y1="52" x2="39" y2="52" />
      </g>
    </svg>
  )
}

/** VoiceLink wordmark — "Voice" + accent "Link" */
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span
      className="font-extrabold tracking-tight"
      style={{ fontSize: size, color: VL_COLORS.text }}
    >
      Voice<span style={{ color: VL_COLORS.accent }}>Link</span>
    </span>
  )
}
