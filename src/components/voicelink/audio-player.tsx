"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, Send, Share2 } from "lucide-react"
import { VL_COLORS } from "@/lib/constants"

interface Props {
  src: string
  duration?: number
  accent?: string
}

export function AudioPlayer({ src, duration = 0, accent = VL_COLORS.accent }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cur, setCur] = useState(0)
  const [total, setTotal] = useState(duration)

  useEffect(() => {
    const a = new Audio(src)
    audioRef.current = a
    const onTime = () => {
      setCur(a.currentTime)
      setProgress(a.duration ? a.currentTime / a.duration : 0)
    }
    const onMeta = () => setTotal(a.duration || duration)
    const onEnd = () => {
      setPlaying(false)
      setProgress(0)
      setCur(0)
    }
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("loadedmetadata", onMeta)
    a.addEventListener("ended", onEnd)
    return () => {
      a.pause()
      a.removeEventListener("timeupdate", onTime)
      a.removeEventListener("loadedmetadata", onMeta)
      a.removeEventListener("ended", onEnd)
    }
  }, [src, duration])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch((e) => console.warn("[VoiceLink] Audio play() rejected:", e))
    }
  }

  const seek = (v: number) => {
    const a = audioRef.current
    if (!a || !a.duration) return
    a.currentTime = v * a.duration
    setProgress(v)
  }

  const bars = 28
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
        style={{ background: `${accent}22`, color: accent }}
        aria-label={playing ? "Pausar" : "Reproducir"}
      >
        {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Waveform-ish bars */}
          <div className="flex items-end gap-[2px] h-6 flex-1">
            {Array.from({ length: bars }).map((_, i) => {
              const active = progress * bars > i
              const h = 30 + Math.abs(Math.sin(i * 1.3)) * 70
              return (
                <span
                  key={i}
                  className="flex-1 rounded-full transition-colors"
                  style={{
                    height: `${h}%`,
                    background: active ? accent : VL_COLORS.text3,
                    opacity: active ? 1 : 0.4,
                  }}
                />
              )
            })}
          </div>
          <span className="text-[10px] tabular-nums shrink-0" style={{ color: VL_COLORS.text3 }}>
            {fmt(cur)} / {fmt(total || duration)}
          </span>
        </div>
        <input
          type="range"
          className="vl-range w-full mt-1"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Progreso del audio"
        />
      </div>
    </div>
  )
}

function fmt(s: number): string {
  if (!s || !isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

export { Send, Share2 }
