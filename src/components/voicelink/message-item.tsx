"use client"

import { useState } from "react"
import { MapPin, Zap, AlertTriangle, Send, Share2, Check, Loader2 } from "lucide-react"
import { VL_COLORS, INTEGRATION_META, type IntegrationId } from "@/lib/constants"
import type { VMessage } from "@/lib/types"
import { Avatar, RoleBadge } from "./shared"
import { AudioPlayer } from "./audio-player"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
}

export function MessageItem({ msg, accent }: { msg: VMessage; accent: string }) {
  const [actions, setActions] = useState(msg.actions || [])
  const [busy, setBusy] = useState<string | null>(null)

  async function runAction(type: string, integration?: IntegrationId) {
    setBusy(type)
    try {
      // Mark as executed on the server
      const next = actions.map((a) =>
        a.type === type && a.integration === integration ? { ...a, executed: true } : a,
      )
      setActions(next)
      await apiFetch(`/api/messages`, {
        method: "PUT",
        json: { id: msg.id, actions: next },
      })

      const label = actions.find(
        (a) => a.type === type && a.integration === integration,
      )?.label

      if (integration) {
        const meta = INTEGRATION_META[integration]
        // Best-effort native share / open integration
        await shareToIntegration(integration, msg.transcript, msg.lat, msg.lng)
        toast.success(`${meta.name}: ${label || "enviado"}`)
      } else if (type === "alert") {
        toast.success("Alerta de emergencia disparada", {
          description: "Notificación enviada a todo el equipo.",
        })
      } else if (type === "share_location") {
        if (msg.lat && msg.lng) {
          await shareToIntegration("whatsapp", `Mi ubicación: https://maps.google.com/?q=${msg.lat},${msg.lng}`, msg.lat, msg.lng)
          toast.success("Ubicación compartida")
        } else {
          toast.info("Ubicación no disponible en este mensaje")
        }
      } else if (type === "report") {
        toast.success("Reporte generado", {
          description: "Se ha creado un informe con la transcripción.",
        })
      }
    } catch (e) {
      toast.error("No se pudo ejecutar la acción")
    } finally {
      setBusy(null)
    }
  }

  const isAlert = msg.type === "alert" || msg.intent === "alerta"

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="vl-fade-in rounded-xl p-3"
      style={{
        background: isAlert ? `${VL_COLORS.red}10` : VL_COLORS.bg2,
        border: isAlert
          ? `0.5px solid ${VL_COLORS.red}44`
          : `0.5px solid ${VL_COLORS.text3}22`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <Avatar
          user={{
            name: msg.userName,
            avatarColor: accent,
            status: "online",
          }}
          size={32}
          showStatus={false}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold" style={{ color: VL_COLORS.text }}>
              {msg.userName}
            </span>
            <RoleBadge role={msg.userRole} />
            {isAlert && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: `${VL_COLORS.red}22`, color: VL_COLORS.red }}
              >
                <AlertTriangle size={10} /> Alerta
              </span>
            )}
            {msg.intent && msg.intent !== "normal" && msg.intent !== "mensaje" && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: `${VL_COLORS.accent2}22`, color: VL_COLORS.accent2 }}
              >
                <Zap size={10} /> {msg.intent}
              </span>
            )}
            <span className="text-[10px] ml-auto" style={{ color: VL_COLORS.text3 }}>
              {timeAgo(msg.createdAt)}
            </span>
          </div>

          {msg.type === "voice" ? (
            <div className="mt-2">
              {msg.audioBase64 && (
                <AudioPlayer src={msg.audioBase64} duration={msg.duration} accent={accent} />
              )}
              {msg.transcript && (
                <p className="text-xs mt-2 leading-relaxed" style={{ color: VL_COLORS.text }}>
                  <span className="font-semibold" style={{ color: VL_COLORS.text2 }}>
                    Transcripción:{" "}
                  </span>
                  {msg.transcript}
                </p>
              )}
              {!msg.transcript && (
                <p className="text-xs mt-2 italic" style={{ color: VL_COLORS.text3 }}>
                  Mensaje de voz sin transcripción
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: VL_COLORS.text }}>
              {msg.transcript}
            </p>
          )}

          {/* Geolocation chip */}
          {msg.lat && msg.lng && (
            <a
              href={`https://www.google.com/maps?q=${msg.lat},${msg.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md hover:opacity-80"
              style={{ background: `${VL_COLORS.green}15`, color: VL_COLORS.green, border: `0.5px solid ${VL_COLORS.green}33` }}
            >
              <MapPin size={10} /> Ver ubicación
            </a>
          )}

          {/* Action chips */}
          {actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {actions.map((a, i) => {
                const meta = a.integration ? INTEGRATION_META[a.integration] : null
                const color = meta?.color ?? VL_COLORS.accent2
                return (
                  <button
                    key={i}
                    onClick={() => !a.executed && runAction(a.type, a.integration)}
                    disabled={a.executed || busy === a.type}
                    className="text-[11px] px-2 py-1 rounded-md flex items-center gap-1 disabled:opacity-70 transition-all hover:brightness-110"
                    style={{ background: `${color}18`, border: `0.5px solid ${color}44`, color }}
                  >
                    {busy === a.type ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : a.executed ? (
                      <Check size={10} />
                    ) : a.type === "alert" ? (
                      <AlertTriangle size={10} />
                    ) : a.type === "share_location" ? (
                      <MapPin size={10} />
                    ) : (
                      <Send size={10} />
                    )}
                    {a.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick share row */}
          {!actions.length && msg.transcript && (
            <ShareRow text={msg.transcript} lat={msg.lat} lng={msg.lng} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ShareRow({
  text,
  lat,
  lng,
}: {
  text: string
  lat?: number
  lng?: number
}) {
  const [busy, setBusy] = useState<IntegrationId | null>(null)
  async function share(integration: IntegrationId) {
    setBusy(integration)
    try {
      await shareToIntegration(integration, text, lat, lng)
      toast.success(`Compartido por ${INTEGRATION_META[integration].name}`)
    } catch {
      toast.error("Compartir cancelado")
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="mt-2 flex items-center gap-1">
      <Share2 size={11} style={{ color: VL_COLORS.text3 }} />
      {(["whatsapp", "email", "telegram", "slack"] as IntegrationId[]).map((id) => {
        const meta = INTEGRATION_META[id]
        return (
          <button
            key={id}
            onClick={() => share(id)}
            disabled={busy === id}
            className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 disabled:opacity-60"
            style={{ background: `${meta.color}15`, color: meta.color }}
            title={meta.description}
          >
            {busy === id ? <Loader2 size={9} className="animate-spin" /> : meta.name}
          </button>
        )
      })}
    </div>
  )
}

async function shareToIntegration(
  integration: IntegrationId,
  text: string,
  lat?: number,
  lng?: number,
) {
  const fullText = lat && lng ? `${text}\n\nUbicación: https://maps.google.com/?q=${lat},${lng}` : text
  // Use native Web Share API when available (great on mobile/iPhone)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "Mensaje de voz VoiceLink",
        text: fullText,
      })
      return
    } catch (e: any) {
      if (e?.name === "AbortError") throw e
      // fall through to deep links
    }
  }
  switch (integration) {
    case "whatsapp":
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank")
      break
    case "email":
      window.open(`mailto:?subject=${encodeURIComponent("Transcripción VoiceLink")}&body=${encodeURIComponent(fullText)}`, "_blank")
      break
    case "telegram":
      window.open(`https://t.me/share/url?url=${encodeURIComponent("https://voicelink.app")}&text=${encodeURIComponent(fullText)}`, "_blank")
      break
    case "slack":
      window.open(`https://slack.com/share`, "_blank")
      break
    case "webhook":
      // no-op demo
      break
  }
}
