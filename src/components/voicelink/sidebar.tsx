"use client"

import {
  Radio,
  Map as MapIcon,
  History,
  Plug,
  ShieldCheck,
  CreditCard,
  UserCircle,
  LogOut,
  X,
  Plus,
  Wifi,
  BatteryFull,
} from "lucide-react"
import { Logo, Wordmark } from "./logo"
import { VL_COLORS } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import type { ViewId } from "@/lib/types"
import { Avatar } from "./shared"
import { useState } from "react"
import { CreateChannelDialog } from "./create-channel-dialog"
import { ChannelIconRender } from "./shared"

const NAV: { id: ViewId; label: string; icon: typeof Radio; adminOnly?: boolean }[] = [
  { id: "channels", label: "Canales", icon: Radio },
  { id: "map", label: "Mapa en vivo", icon: MapIcon },
  { id: "history", label: "Historial", icon: History },
  { id: "integrations", label: "Integraciones", icon: Plug },
  { id: "admin", label: "Panel admin", icon: ShieldCheck, adminOnly: true },
  { id: "plans", label: "Planes", icon: CreditCard },
  { id: "profile", label: "Perfil", icon: UserCircle },
]

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const user = useVL((s) => s.user)
  const activeView = useVL((s) => s.activeView)
  const setView = useVL((s) => s.setView)
  const logout = useVL((s) => s.logout)
  const channels = useVL((s) => s.channels)
  const activeChannelId = useVL((s) => s.activeChannelId)
  const setActiveChannel = useVL((s) => s.setActiveChannel)
  const [creating, setCreating] = useState(false)

  const nav = NAV.filter((n) => !n.adminOnly || user?.role === "administrador")

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: VL_COLORS.bg2,
          borderRight: `0.5px solid ${VL_COLORS.text3}22`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: `0.5px solid ${VL_COLORS.text3}22` }}
        >
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <Wordmark size={18} />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded"
            style={{ color: VL_COLORS.text2 }}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Channels quick list */}
        <div className="flex-1 overflow-y-auto vl-scroll px-3 py-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: VL_COLORS.text3 }}
            >
              Canales
            </span>
            <button
              onClick={() => setCreating(true)}
              className="p-1 rounded hover:bg-[var(--vl-bg3)]"
              style={{ color: VL_COLORS.text2 }}
              aria-label="Crear canal"
              title="Crear canal"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5 mb-4">
            {channels.length === 0 && (
              <div className="text-[11px] px-2 py-1" style={{ color: VL_COLORS.text3 }}>
                Esperando mensajes...
              </div>
            )}
            {channels.map((c) => {
              const active = c.id === activeChannelId
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChannel(c.id)
                    setView("channels")
                    onClose()
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left"
                  style={{
                    background: active ? `${VL_COLORS.accent}15` : "transparent",
                    borderLeft: active
                      ? `2px solid ${VL_COLORS.accent}`
                      : "2px solid transparent",
                  }}
                >
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${c.color}18`, color: c.color }}
                  >
                    <ChannelIconRender icon={c.icon} size={13} color={c.color} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-xs font-semibold truncate"
                      style={{ color: active ? VL_COLORS.text : VL_COLORS.text2 }}
                    >
                      {c.name}
                    </span>
                    <span
                      className="block text-[10px] truncate"
                      style={{ color: VL_COLORS.text3 }}
                    >
                      {c.members.length} miembros
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div
            className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-2"
            style={{ color: VL_COLORS.text3 }}
          >
            Navegación
          </div>
          <nav className="space-y-0.5">
            {nav.map((n) => {
              const active = activeView === n.id
              const Icon = n.icon
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setView(n.id)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left"
                  style={{
                    background: active ? `${VL_COLORS.accent}15` : "transparent",
                    color: active ? VL_COLORS.accent : VL_COLORS.text2,
                  }}
                >
                  <Icon size={16} />
                  <span className="text-xs font-semibold">{n.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* User footer */}
        <div
          className="p-3"
          style={{ borderTop: `0.5px solid ${VL_COLORS.text3}22` }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            {user && <Avatar user={user} size={34} />}
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: VL_COLORS.text }}
              >
                {user?.name}
              </div>
              <div
                className="text-[10px] truncate flex items-center gap-1"
                style={{ color: VL_COLORS.text3 }}
              >
                <Wifi size={10} style={{ color: VL_COLORS.green }} />
                {user?.plan} ·{" "}
                <BatteryFull size={10} style={{ color: VL_COLORS.green }} />
                {user?.battery}%
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded hover:bg-[var(--vl-bg3)]"
              style={{ color: VL_COLORS.text2 }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <CreateChannelDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
