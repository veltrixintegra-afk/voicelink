"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  MessageSquare,
  Zap,
  Radio,
  Users,
  Cpu,
  Gauge,
  Activity,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { VL_COLORS } from "@/lib/constants"
import { apiFetch } from "@/lib/api"
import { useVL } from "@/store/use-voicelink"
import { Avatar, RoleBadge } from "../shared"
import type { StatsResponse, VUser } from "@/lib/types"
import { toast } from "sonner"

export function AdminView() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [users, setUsers] = useState<VUser[]>([])
  const user = useVL((s) => s.user)
  const channels = useVL((s) => s.channels)
  const removeChannel = useVL((s) => s.removeChannel)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [s, u] = await Promise.all([
          apiFetch<StatsResponse>("/api/stats"),
          apiFetch<{ users: VUser[] }>("/api/users"),
        ])
        if (active) {
          setStats(s)
          setUsers(u.users)
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
    const id = setInterval(load, 15000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  if (user?.role !== "administrador") {
    return (
      <div className="p-6 max-w-md mx-auto text-center mt-10">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
          style={{ background: `${VL_COLORS.red}15`, color: VL_COLORS.red }}
        >
          <ShieldCheck size={26} />
        </div>
        <h2 className="text-base font-bold" style={{ color: VL_COLORS.text }}>
          Solo Admin
        </h2>
        <p className="text-xs mt-1" style={{ color: VL_COLORS.text2 }}>
          El panel administrativo solo está disponible para administradores.
        </p>
      </div>
    )
  }

  const systemRows: [string, string, string][] = [
    ["Whisper v3", stats ? `${stats.whisperLatency}ms` : "—", VL_COLORS.green],
    ["Precisión", stats ? `${stats.whisperAccuracy}%` : "—", VL_COLORS.accent],
    ["CPU", stats ? `${stats.cpuLoad}%` : "—", stats && stats.cpuLoad > 70 ? VL_COLORS.red : VL_COLORS.amber],
  ]

  async function deleteChannel(id: string, name: string) {
    if (id === "general") return
    if (!confirm(`¿Eliminar canal "${name}" permanentemente?`)) return
    try {
      await apiFetch(`/api/channels?id=${id}`, { method: "DELETE" })
      removeChannel(id)
      toast.success("Canal eliminado")
    } catch {
      toast.error("No se pudo eliminar")
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: VL_COLORS.text }}>
          <ShieldCheck size={18} style={{ color: VL_COLORS.accent2 }} /> Panel administrativo
        </h2>
        <p className="text-xs mt-1" style={{ color: VL_COLORS.text2 }}>
          Control administrativo del sistema · VoiceLink Cloud
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          icon={<MessageSquare size={16} />}
          label="Mensajes hoy"
          value={stats?.messagesToday ?? 0}
          color={VL_COLORS.accent}
        />
        <StatCard
          icon={<Zap size={16} />}
          label="Acciones hoy"
          value={stats?.actionsToday ?? 0}
          color={VL_COLORS.accent2}
        />
        <StatCard
          icon={<Radio size={16} />}
          label="Canales activos"
          value={stats?.activeChannels ?? channels.length}
          color={VL_COLORS.green}
        />
        <StatCard
          icon={<Users size={16} />}
          label="En línea"
          value={stats?.onlineUsers ?? 0}
          color={VL_COLORS.amber}
        />
      </div>

      {/* Chart + system */}
      <div className="grid lg:grid-cols-3 gap-3 mb-4">
        <div
          className="lg:col-span-2 rounded-xl p-4"
          style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-bold" style={{ color: VL_COLORS.text }}>
                Actividad (12h)
              </span>
              <p className="text-[11px]" style={{ color: VL_COLORS.text3 }}>
                Mensajes y acciones ejecutadas hoy
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1" style={{ color: VL_COLORS.text2 }}>
                <span className="w-2 h-2 rounded-full" style={{ background: VL_COLORS.accent }} /> Mensajes
              </span>
              <span className="flex items-center gap-1" style={{ color: VL_COLORS.text2 }}>
                <span className="w-2 h-2 rounded-full" style={{ background: VL_COLORS.amber }} /> Acciones
              </span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chart || []} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={VL_COLORS.accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={VL_COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gActs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={VL_COLORS.amber} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={VL_COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={VL_COLORS.bg4} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke={VL_COLORS.text3} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={VL_COLORS.text3} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: VL_COLORS.bg3,
                    border: `0.5px solid ${VL_COLORS.text3}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: VL_COLORS.text,
                  }}
                  labelStyle={{ color: VL_COLORS.text2 }}
                />
                <Area type="monotone" dataKey="mensajes" stroke={VL_COLORS.accent} strokeWidth={1.5} fill="url(#gMsgs)" dot={false} />
                <Area type="monotone" dataKey="acciones" stroke={VL_COLORS.amber} strokeWidth={1.5} fill="url(#gActs)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
        >
          <span className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: VL_COLORS.text }}>
            <Activity size={14} style={{ color: VL_COLORS.green }} /> Sistema IA
          </span>
          <div className="space-y-3">
            {systemRows.map(([label, value, color]) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px]" style={{ color: VL_COLORS.text2 }}>
                    {label === "Whisper v3" ? <Gauge size={11} className="inline mr-1" /> : label === "Precisión" ? <Activity size={11} className="inline mr-1" /> : <Cpu size={11} className="inline mr-1" />}
                    {label}
                  </span>
                  <span className="text-xs font-bold" style={{ color }}>
                    {value}
                  </span>
                </div>
                {label === "Precisión" && stats && (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: VL_COLORS.bg4 }}>
                    <div style={{ width: `${stats.whisperAccuracy}%`, background: color, height: "100%" }} />
                  </div>
                )}
                {label === "CPU" && stats && (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: VL_COLORS.bg4 }}>
                    <div style={{ width: `${stats.cpuLoad}%`, background: color, height: "100%" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channels management */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
      >
        <span className="text-sm font-bold mb-3 block" style={{ color: VL_COLORS.text }}>
          Canales del sistema
        </span>
        <div className="space-y-1">
          {channels.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2 rounded-lg"
              style={{ background: VL_COLORS.bg3 }}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${c.color}18`, color: c.color }}>
                <Radio size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: VL_COLORS.text }}>{c.name}</div>
                <div className="text-[10px]" style={{ color: VL_COLORS.text3 }}>{c.members.length} miembros · {c.id}</div>
              </div>
              {c.id !== "general" && (
                <button
                  onClick={() => deleteChannel(c.id, c.name)}
                  className="p-1.5 rounded"
                  style={{ color: VL_COLORS.red, background: `${VL_COLORS.red}15` }}
                  title="Eliminar este canal permanentemente"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Users management */}
      <div
        className="rounded-xl p-4"
        style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
      >
        <span className="text-sm font-bold mb-3 block" style={{ color: VL_COLORS.text }}>
          Usuarios ({users.length})
        </span>
        <div className="space-y-1 max-h-80 overflow-y-auto vl-scroll">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-2 rounded-lg"
              style={{ background: VL_COLORS.bg3 }}
            >
              <Avatar user={u} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: VL_COLORS.text }}>
                  {u.name} {u.id === user?.id && <span style={{ color: VL_COLORS.text3 }}>(tú)</span>}
                </div>
                <div className="text-[10px] truncate" style={{ color: VL_COLORS.text3 }}>{u.email}</div>
              </div>
              <RoleBadge role={u.role} />
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  background: `${VL_COLORS.accent2}18`,
                  color: VL_COLORS.accent2,
                  textTransform: "capitalize",
                }}
              >
                {u.plan}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-extrabold" style={{ color: VL_COLORS.text }}>
        {value}
      </div>
      <div className="text-[11px]" style={{ color: VL_COLORS.text3 }}>
        {label}
      </div>
    </div>
  )
}
