"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, History as HistoryIcon, Filter, MessageSquare, Zap } from "lucide-react"
import { VL_COLORS, CHANNEL_LABELS } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import { apiFetch } from "@/lib/api"
import { ChannelIconRender } from "../shared"
import type { VChannel, VMessage } from "@/lib/types"
import { MessageItem } from "../message-item"

export function HistoryView() {
  const [q, setQ] = useState("")
  const [channelFilter, setChannelFilter] = useState<string>("all")
  const [all, setAll] = useState<VMessage[]>([])
  const channels = useVL((s) => s.channels)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await apiFetch<{ messages: VMessage[] }>(
          `/api/messages?q=${encodeURIComponent(q)}`,
        )
        if (active) setAll(res.messages)
      } catch (e) {
        console.error(e)
      }
    }
    const t = setTimeout(load, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [q])

  const filtered = useMemo(() => {
    let list = all
    if (channelFilter !== "all") {
      list = list.filter((m) => m.channelId === channelFilter)
    }
    if (q) {
      const needle = q.toLowerCase()
      list = list.filter(
        (m) =>
          m.transcript.toLowerCase().includes(needle) ||
          m.userName.toLowerCase().includes(needle),
      )
    }
    return [...list].reverse()
  }, [all, q, channelFilter])

  const actionsCount = filtered.reduce(
    (acc, m) => acc + (m.actions?.length || 0),
    0,
  )

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: VL_COLORS.text }}>
          <HistoryIcon size={18} style={{ color: VL_COLORS.accent }} /> Historial y búsqueda avanzada
        </h2>
        <p className="text-xs mt-1" style={{ color: VL_COLORS.text2 }}>
          Busca en transcripciones de todos los canales. Whisper IA indexa cada mensaje.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: VL_COLORS.text3 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en transcripciones..."
            className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
            style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}33`, color: VL_COLORS.text }}
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: VL_COLORS.text3 }} />
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="appearance-none rounded-xl py-2.5 pl-8 pr-8 text-sm outline-none w-full sm:w-auto"
            style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}33`, color: VL_COLORS.text }}
          >
            <option value="all">Todos los canales</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Mensajes" value={filtered.length} icon={<MessageSquare size={14} />} color={VL_COLORS.accent} />
        <Stat label="Acciones IA" value={actionsCount} icon={<Zap size={14} />} color={VL_COLORS.accent2} />
        <Stat label="Canales" value={channels.length} icon={<HistoryIcon size={14} />} color={VL_COLORS.green} />
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}>
            <Search size={28} className="mx-auto mb-2" style={{ color: VL_COLORS.text3 }} />
            <p className="text-sm" style={{ color: VL_COLORS.text2 }}>Sin historial avanzado</p>
            <p className="text-xs mt-1" style={{ color: VL_COLORS.text3 }}>
              {q ? "Prueba con otra búsqueda." : "Envía un mensaje PTT para empezar."}
            </p>
          </div>
        )}
        {filtered.map((m) => {
          const ch = channels.find((c) => c.id === m.channelId)
          return (
            <div key={m.id}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                {ch && (
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: `${ch.color}18` }}
                  >
                    <ChannelIconRender icon={ch.icon} size={11} color={ch.color} />
                  </span>
                )}
                <span className="text-[11px] font-semibold" style={{ color: VL_COLORS.text2 }}>
                  {ch?.name || CHANNEL_LABELS[m.channelId] || m.channelId}
                </span>
                <span className="text-[10px]" style={{ color: VL_COLORS.text3 }}>
                  {new Date(m.createdAt).toLocaleString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <MessageItem msg={m} accent={ch?.color ?? VL_COLORS.accent} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-extrabold" style={{ color: VL_COLORS.text }}>
        {value}
      </div>
    </div>
  )
}
