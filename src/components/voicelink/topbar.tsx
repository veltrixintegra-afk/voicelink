"use client"

import { Menu, Satellite, Plus, Users, Activity } from "lucide-react"
import { VL_COLORS } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import type { ViewId } from "@/lib/types"
import { ChannelIconRender } from "./shared"

const VIEW_TITLES: Record<ViewId, { title: string; sub: string }> = {
  channels: { title: "Canales activos", sub: "Mantén presionado para hablar" },
  map: { title: "Mapa en tiempo real", sub: "Georeferencia en tiempo real" },
  history: { title: "Historial", sub: "Historial y búsqueda avanzada" },
  integrations: { title: "Integraciones", sub: "WhatsApp, Email, Telegram, Slack" },
  admin: { title: "Panel administrativo", sub: "Control administrativo del sistema" },
  plans: { title: "Planes", sub: "Selecciona el plan que mejor se adapta a tu equipo" },
  profile: { title: "Perfil", sub: "Tu cuenta VoiceLink" },
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const activeView = useVL((s) => s.activeView)
  const channels = useVL((s) => s.channels)
  const activeChannelId = useVL((s) => s.activeChannelId)
  const users = useVL((s) => s.users)

  const meta = VIEW_TITLES[activeView]
  const channel = channels.find((c) => c.id === activeChannelId)
  const onlineCount = users.filter((u) => u.status === "online").length

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
      style={{
        background: `${VL_COLORS.bg}cc`,
        backdropFilter: "blur(12px)",
        borderBottom: `0.5px solid ${VL_COLORS.text3}22`,
      }}
    >
      <button
        onClick={onMenu}
        className="lg:hidden p-1.5 rounded-lg"
        style={{ color: VL_COLORS.text2, background: VL_COLORS.bg2 }}
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {activeView === "channels" && channel ? (
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${channel.color}18`, border: `0.5px solid ${channel.color}33` }}
          >
            <ChannelIconRender icon={channel.icon} size={18} color={channel.color} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: VL_COLORS.text }}>
              {channel.name}
            </div>
            <div className="text-[11px] truncate" style={{ color: VL_COLORS.text3 }}>
              {channel.description || meta.sub}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: VL_COLORS.text }}>
            {meta.title}
          </div>
          <div className="text-[11px] truncate" style={{ color: VL_COLORS.text3 }}>
            {meta.sub}
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Pill icon={<Users size={12} />} label={`${onlineCount} en línea`} color={VL_COLORS.green} />
        <Pill icon={<Satellite size={12} />} label="GPS activo" color={VL_COLORS.accent} hideOnMobile />
        <Pill icon={<Activity size={12} />} label="Whisper v3" color={VL_COLORS.accent2} hideOnMobile />
      </div>
    </header>
  )
}

function Pill({
  icon,
  label,
  color,
  hideOnMobile,
}: {
  icon: React.ReactNode
  label: string
  color: string
  hideOnMobile?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${hideOnMobile ? "hidden sm:flex" : "flex"}`}
      style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-[11px] font-semibold" style={{ color: VL_COLORS.text2 }}>
        {label}
      </span>
    </div>
  )
}

export { Plus }
