"use client"

import { VL_COLORS } from "@/lib/constants"

interface LogoProps {
  size?: number
  animated?: boolean
  className?: string
}

/** VoiceLink mark — rounded dark tile with the voice-wave glyph (breathing animation). */
export function Logo({ size = 36, animated = true, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      className={className}
      aria-label="VoiceLink"
      role="img"
    >
      <path
        d="M24.51,28.51H5.49c-2.21,0-4-1.79-4-4V5.49c0-2.21,1.79-4,4-4h19.03c2.21,0,4,1.79,4,4v19.03
    C28.51,26.72,26.72,28.51,24.51,28.51z"
        fill="#0e0f14"
        stroke="#4f6ef7"
        strokeWidth={0.6317}
        strokeMiterlimit={10}
      />
      <g className={animated ? "vl-breathe" : ""}>
        <path
          d="M15.47,7.1l-1.3,1.85c-0.2,0.29-0.54,0.47-0.9,0.47h-7.1V7.09C6.16,7.1,15.47,7.1,15.47,7.1z"
          fill="#4f6ef7"
        />
        <polygon
          points="24.3,7.1 13.14,22.91 5.7,22.91 16.86,7.1"
          fill="#4f6ef7"
        />
        <path
          d="M14.53,22.91l1.31-1.86c0.2-0.29,0.54-0.47,0.9-0.47h7.09v2.33H14.53z"
          fill="#4f6ef7"
        />
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
