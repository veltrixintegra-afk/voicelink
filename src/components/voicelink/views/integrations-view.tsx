"use client"

import { useState } from "react"
import {
  MessageCircle,
  Mail,
  Send,
  Hash,
  Webhook,
  Loader2,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { VL_COLORS, INTEGRATION_META, type IntegrationId } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import { toast } from "sonner"

const CARDS: {
  id: IntegrationId
  icon: typeof Mail
  desc: string
  status: "active" | "configurable"
  enabled: boolean
}[] = [
  { id: "whatsapp", icon: MessageCircle, desc: "Enviar mensajes de voz y transcripciones a WhatsApp.", status: "active", enabled: true },
  { id: "email", icon: Mail, desc: "Email corporativo con la transcripción adjunta.", status: "active", enabled: true },
  { id: "telegram", icon: Send, desc: "Enviar por Telegram a grupos y canales.", status: "active", enabled: true },
  { id: "slack", icon: Hash, desc: "Publicar en canales de Slack automáticamente.", status: "active", enabled: false },
  { id: "webhook", icon: Webhook, desc: "Disparar webhook con el payload del mensaje.", status: "configurable", enabled: false },
]

export function IntegrationsView() {
  const messages = useVL((s) => s.messages)
  const user = useVL((s) => s.user)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState<IntegrationId | null>(null)

  const lastTranscript = messages[messages.length - 1]?.transcript || ""

  async function share(id: IntegrationId) {
    const body = text || lastTranscript
    if (!body) {
      toast.error("No hay texto para compartir")
      return
    }
    setBusy(id)
    const meta = INTEGRATION_META[id]
    const full = user?.lat ? `${body}\n\nUbicación: https://maps.google.com/?q=${user.lat},${user.lng}` : body
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title: "Transcripción VoiceLink", text: full })
          toast.success(`Compartido por ${meta.name}`)
          return
        } catch (e: any) {
          if (e?.name === "AbortError") throw e
        }
      }
      switch (id) {
        case "whatsapp":
          window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, "_blank")
          break
        case "email":
          window.open(`mailto:?subject=${encodeURIComponent("Transcripción VoiceLink")}&body=${encodeURIComponent(full)}`, "_blank")
          break
        case "telegram":
          window.open(`https://t.me/share/url?url=${encodeURIComponent("https://voicelink.app")}&text=${encodeURIComponent(full)}`, "_blank")
          break
        case "slack":
          window.open(`https://slack.com/share`, "_blank")
          break
        case "webhook":
          // demo: simulate
          await new Promise((r) => setTimeout(r, 600))
          break
      }
      toast.success(`${meta.name}: ${meta.description}`)
    } catch (e: any) {
      if (e?.name === "AbortError") {
        toast.error("Compartir cancelado")
      } else {
        toast.error("Compartir falló")
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: VL_COLORS.text }}>
          <Sparkles size={18} style={{ color: VL_COLORS.accent2 }} /> Integraciones
        </h2>
        <p className="text-xs mt-1" style={{ color: VL_COLORS.text2 }}>
          Whisper IA detecta intención y dispara acciones automáticas en tus apps.
        </p>
      </div>

      {/* Quick share box */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}33` }}
      >
        <label className="text-xs font-semibold mb-2 block" style={{ color: VL_COLORS.text2 }}>
          Compartir transcripción
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={lastTranscript || "Escribe o usa tu última transcripción…"}
          rows={3}
          className="w-full rounded-lg p-3 text-sm outline-none resize-none vl-scroll"
          style={{ background: VL_COLORS.bg3, border: `0.5px solid ${VL_COLORS.text3}33`, color: VL_COLORS.text }}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.keys(INTEGRATION_META) as IntegrationId[]).map((id) => {
            const meta = INTEGRATION_META[id]
            const card = CARDS.find((c) => c.id === id)!
            const Cmp = card.icon
            return (
              <button
                key={id}
                onClick={() => share(id)}
                disabled={busy === id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-60 transition-all hover:brightness-110"
                style={{ background: `${meta.color}15`, border: `0.5px solid ${meta.color}44`, color: meta.color }}
              >
                {busy === id ? <Loader2 size={13} className="animate-spin" /> : <Cmp size={13} />}
                {meta.description}
              </button>
            )
          })}
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {CARDS.map((c) => {
          const meta = INTEGRATION_META[c.id]
          const Cmp = c.icon
          return (
            <div
              key={c.id}
              className="rounded-xl p-4 flex flex-col"
              style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${meta.color}18`, color: meta.color }}
                >
                  <Cmp size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: VL_COLORS.text }}>
                      {meta.name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1"
                      style={{
                        background: c.enabled ? `${VL_COLORS.green}18` : `${VL_COLORS.amber}18`,
                        color: c.enabled ? VL_COLORS.green : VL_COLORS.amber,
                      }}
                    >
                      {c.enabled ? <Check size={9} /> : null}
                      {c.enabled ? "Conectado" : "Configurable"}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: VL_COLORS.text2 }}>
                    {c.desc}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px]" style={{ color: VL_COLORS.text3 }}>
                  {c.id === "webhook" ? "POST /webhook" : `v1.0 · ${c.status === "active" ? "Producción" : "Sandbox"}`}
                </span>
                <button
                  onClick={() => share(c.id)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md"
                  style={{ background: `${meta.color}15`, color: meta.color }}
                >
                  Probar <ExternalLink size={10} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
