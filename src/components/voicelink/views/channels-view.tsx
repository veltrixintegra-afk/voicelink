"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff, Loader2, Sparkles, Trash2, Radio } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { VL_COLORS } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import { usePTT } from "../use-ptt"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { MessageItem } from "../message-item"
import type { IntentResponse, VMessage, VUser } from "@/lib/types"

export function ChannelsView() {
  const user = useVL((s) => s.user)
  const channels = useVL((s) => s.channels)
  const activeChannelId = useVL((s) => s.activeChannelId)
  const messages = useVL((s) => s.messages)
  const addMessage = useVL((s) => s.addMessage)
  const setLiveTranscript = useVL((s) => s.setLiveTranscript)
  const liveTranscript = useVL((s) => s.liveTranscript)
  const setTransmitting = useVL((s) => s.setTransmitting)
  const isTransmitting = useVL((s) => s.isTransmitting)

  const [transcribing, setTranscribing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement | null>(null)

  const channel = channels.find((c) => c.id === activeChannelId)
  const channelColor = channel?.color ?? VL_COLORS.accent

  // Auto-scroll feed to bottom on new message
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages.length])

  const handleAudio = useCallback(
    async (audioBase64: string, duration: number, liveTranscript: string) => {
      setLiveTranscript("")
      setTranscribing(true)
      setProcessing(true)
      try {
        // 1) Transcribe via ASR (Whisper). The model auto-detects language,
        // so Spanish audio → Spanish text. We keep the es-CL Web Speech
        // live transcript as a robust Spanish fallback.
        const tr = await apiFetch<{ text: string; duration: number }>(
          "/api/transcribe",
          { method: "POST", json: { audio: audioBase64 } },
        )
        const asrText = (tr.text || "").trim()
        // Prefer ASR; fall back to live es-CL transcript if ASR is empty/short.
        const transcript =
          asrText.length >= liveTranscript.length * 0.6 || !liveTranscript
            ? asrText
            : liveTranscript

        // 2) Detect intent via LLM
        let intent: IntentResponse | null = null
        try {
          intent = await apiFetch<IntentResponse>("/api/intent", {
            method: "POST",
            json: { transcript },
          })
        } catch (e) {
          console.warn("[VoiceLink] intent error:", e)
        }

        // 3) Persist message
        const res = await apiFetch<{ message: VMessage; user: VUser }>(
          "/api/messages",
          {
            method: "POST",
            json: {
              channelId: activeChannelId,
              type: "voice",
              transcript,
              audioBase64,
              duration,
              lat: user?.lat,
              lng: user?.lng,
              intent: intent?.intent,
              actions: intent?.actions,
            },
          },
        )
        addMessage(res.message)
      } catch (e) {
        console.error("[VoiceLink] PTT flow error:", e)
        toast.error("No se pudo procesar el mensaje de voz")
        // Still store the voice message — use the live es-CL transcript if we have it.
        try {
          const res = await apiFetch<{ message: VMessage }>("/api/messages", {
            method: "POST",
            json: {
              channelId: activeChannelId,
              type: "voice",
              transcript: liveTranscript || "",
              audioBase64,
              duration,
              lat: user?.lat,
              lng: user?.lng,
            },
          })
          addMessage(res.message)
        } catch {
          /* ignore */
        }
      } finally {
        setTranscribing(false)
        setProcessing(false)
      }
    },
    [activeChannelId, user?.lat, user?.lng, addMessage, setLiveTranscript],
  )

  const ptt = usePTT({
    onAudioReady: handleAudio,
    onLiveTranscript: setLiveTranscript,
    onStateChange: setTransmitting,
  })

  // Keyboard PTT: hold Space to talk
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !ptt.transmitting && !e.repeat) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA") return
        e.preventDefault()
        void ptt.start()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && ptt.transmitting) {
        e.preventDefault()
        ptt.stop()
      }
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [ptt])

  async function deleteChannel() {
    if (!channel) return
    try {
      await apiFetch(`/api/channels?id=${channel.id}`, { method: "DELETE" })
      useVL.getState().removeChannel(channel.id)
      toast.success("Canal eliminado")
    } catch (e) {
      toast.error("No se pudo eliminar el canal")
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto vl-scroll px-3 sm:px-4 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${channelColor}15`, border: `0.5px solid ${channelColor}33` }}
            >
              <Radio size={28} style={{ color: channelColor }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: VL_COLORS.text }}>
              Sin mensajes aún
            </p>
            <p className="text-xs mt-1 max-w-xs" style={{ color: VL_COLORS.text3 }}>
              Presiona el botón PTT para transmitir. Mantén presionado para hablar.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageItem
            key={m.id}
            msg={m}
            accent={
              channels.find((c) => c.id === m.channelId)?.color ?? VL_COLORS.accent
            }
          />
        ))}

        {/* Live transcription while pressing */}
        <AnimatePresence>
          {(transcribing || (ptt.transmitting && liveTranscript)) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl p-3"
              style={{
                background: `${VL_COLORS.accent}10`,
                border: `0.5px solid ${VL_COLORS.accent}44`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={12} style={{ color: VL_COLORS.accent }} />
                <span className="text-[11px] font-semibold" style={{ color: VL_COLORS.accent }}>
                  {transcribing ? "Transcribiendo con Whisper…" : "Transcripción en vivo"}
                </span>
                {transcribing && (
                  <Loader2 size={11} className="animate-spin ml-auto" style={{ color: VL_COLORS.accent }} />
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: VL_COLORS.text }}>
                {liveTranscript || "Habla ahora…"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PTT dock */}
      <div
        className="px-4 py-4"
        style={{
          background: VL_COLORS.bg2,
          borderTop: `0.5px solid ${VL_COLORS.text3}22`,
        }}
      >
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {/* Delete channel (non-general only) */}
          {channel && channel.id !== "general" && (
            <button
              onClick={() => {
                if (deleteConfirmId === channel.id) {
                  void deleteChannel()
                  setDeleteConfirmId(null)
                } else {
                  setDeleteConfirmId(channel.id)
                  toast.info("Presiona nuevamente para confirmar eliminación")
                  setTimeout(() => setDeleteConfirmId(null), 3000)
                }
              }}
              className="hidden sm:flex w-11 h-11 rounded-full items-center justify-center"
              style={{
                background: `${VL_COLORS.red}15`,
                color: deleteConfirmId === channel.id ? VL_COLORS.red : VL_COLORS.text3,
                border: `0.5px solid ${VL_COLORS.red}33`,
              }}
              title="Eliminar este canal permanentemente"
            >
              <Trash2 size={16} />
            </button>
          )}

          <PTTButton
            transmitting={ptt.transmitting}
            micLevel={ptt.micLevel}
            disabled={processing}
            color={channelColor}
            onStart={ptt.start}
            onStop={ptt.stop}
            error={ptt.error}
          />

          <div className="hidden sm:flex flex-col items-start min-w-[120px]">
            <span className="text-[11px] font-semibold" style={{ color: VL_COLORS.text2 }}>
              {processing
                ? "Procesando IA…"
                : ptt.transmitting
                  ? "Transmitiendo…"
                  : "PTT listo"}
            </span>
            <span className="text-[10px]" style={{ color: VL_COLORS.text3 }}>
              {ptt.transmitting ? "Suelta para enviar" : "Mantén presionado o usa Espacio"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PTTButton({
  transmitting,
  micLevel,
  disabled,
  color,
  onStart,
  onStop,
  error,
}: {
  transmitting: boolean
  micLevel: number
  disabled: boolean
  color: string
  onStart: () => void
  onStop: () => void
  error: string | null
}) {
  // Pointer + touch handlers (hold to talk)
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (!disabled && !transmitting) onStart()
  }
  const onUp = (e: React.PointerEvent) => {
    e.preventDefault()
    if (transmitting) onStop()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Pulse rings while transmitting */}
        {transmitting && (
          <>
            <span
              className="absolute inset-0 rounded-full ptt-pulse"
              style={{ background: `${color}33` }}
            />
            <span
              className="absolute inset-0 rounded-full ptt-pulse"
              style={{ background: `${color}22`, animationDelay: "0.5s" }}
            />
          </>
        )}
        <button
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={(e) => transmitting && onUp(e)}
          onPointerCancel={onUp}
          disabled={disabled}
          className="relative w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-full flex flex-col items-center justify-center select-none touch-none transition-all disabled:opacity-60"
          style={{
            background: transmitting
              ? `radial-gradient(circle, ${color}, ${color}cc)`
              : `linear-gradient(180deg, ${VL_COLORS.bg3}, ${VL_COLORS.bg2})`,
            border: transmitting
              ? `2px solid ${color}`
              : `1.5px solid ${color}55`,
            boxShadow: transmitting
              ? `0 0 40px ${color}66, inset 0 0 20px ${color}33`
              : `0 4px 16px rgba(0,0,0,0.3)`,
            transform: transmitting ? "scale(1.05)" : "scale(1)",
          }}
          aria-label={transmitting ? "Soltar para enviar" : "Mantén presionado para hablar"}
        >
          {/* Mic-level ring */}
          <span
            className="absolute rounded-full transition-all"
            style={{
              inset: 6,
              border: `2px solid ${transmitting ? "#fff" : color}`,
              opacity: transmitting ? 0.3 + micLevel * 0.7 : 0.5,
              transform: `scale(${transmitting ? 0.9 + micLevel * 0.3 : 1})`,
            }}
          />
          {disabled ? (
            <Loader2 size={26} className="animate-spin" style={{ color }} />
          ) : transmitting ? (
            <Mic size={26} color="#fff" />
          ) : (
            <Mic size={26} style={{ color }} />
          )}
          <span
            className="text-[9px] font-extrabold tracking-wider mt-1"
            style={{ color: transmitting ? "#fff" : color }}
          >
            {transmitting ? "HABLAR" : "PTT"}
          </span>
        </button>
      </div>
      {error && (
        <span className="text-[10px] mt-2 flex items-center gap-1" style={{ color: VL_COLORS.red }}>
          <MicOff size={10} /> {error}
        </span>
      )}
    </div>
  )
}
