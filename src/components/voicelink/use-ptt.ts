"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UsePTTOptions {
  onAudioReady: (base64: string, durationSec: number) => void
  onLiveTranscript?: (text: string) => void
  onStateChange?: (transmitting: boolean) => void
}

/**
 * Push-to-Talk hook.
 * - Records audio via MediaRecorder (webm/opus; Safari falls back to mp4/aac).
 * - Provides live partial transcription via the Web Speech API when available
 *   (used for the on-screen live caption while pressing).
 * - On release, returns a base64 data URL of the recording + duration.
 */
export function usePTT({ onAudioReady, onLiveTranscript, onStateChange }: UsePTTOptions) {
  const [transmitting, setTransmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startRef = useRef<number>(0)
  const recognitionRef = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const optsRef = useRef(onAudioReady)
  useEffect(() => {
    optsRef.current = onAudioReady
  }, [onAudioReady])

  const stopAnalyser = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    analyserRef.current = null
  }

  const startSpeech = useCallback(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null
    if (!SR) return
    try {
      const rec = new SR()
      rec.lang = "es-CL"
      rec.continuous = true
      rec.interimResults = true
      let full = ""
      rec.onresult = (e: any) => {
        let interim = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) full += t
          else interim += t
        }
        onLiveTranscript?.((full + " " + interim).trim())
      }
      rec.onerror = (e: any) => {
        console.warn("[VoiceLink] Web speech recognition error:", e.error)
      }
      rec.start()
      recognitionRef.current = rec
    } catch (e) {
      console.warn("[VoiceLink] Could not start speech recognition:", e)
    }
  }, [onLiveTranscript])

  const stopSpeech = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    recognitionRef.current = null
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Mic level analyser for the visualizer
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avg = sum / data.length
        setMicLevel(Math.min(1, avg / 90))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      // Pick a supported mime type
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
      ]
      const mime =
        candidates.find((c) =>
          typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
            ? MediaRecorder.isTypeSupported(c)
            : false,
        ) || ""

      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mime || "audio/webm",
        })
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          const duration = Math.max(
            1,
            Math.round((Date.now() - startRef.current) / 1000),
          )
          optsRef.current(dataUrl, duration)
        }
        reader.readAsDataURL(blob)
      }
      mr.start()
      mediaRef.current = mr
      startRef.current = Date.now()
      setTransmitting(true)
      onStateChange?.(true)
      startSpeech()
    } catch (e) {
      console.error("[VoiceLink] Audio recording error:", e)
      setError("Permiso de micrófono denegado")
      setTransmitting(false)
      onStateChange?.(false)
    }
  }, [onStateChange, startSpeech])

  const stop = useCallback(() => {
    stopAnalyser()
    stopSpeech()
    try {
      mediaRef.current?.stop()
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    mediaRef.current = null
    setTransmitting(false)
    setMicLevel(0)
    onStateChange?.(false)
  }, [onStateChange, stopSpeech])

  useEffect(() => {
    return () => {
      stopAnalyser()
      stopSpeech()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [stopSpeech])

  return { transmitting, error, micLevel, start, stop }
}
