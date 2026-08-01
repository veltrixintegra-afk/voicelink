"use client"

import { useState } from "react"
import {
  Mail,
  MapPin,
  BatteryFull,
  Wifi,
  ShieldCheck,
  Crosshair,
  Loader2,
  LogOut,
  Globe,
} from "lucide-react"
import { VL_COLORS, ROLES } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import { Avatar, RoleBadge } from "../shared"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import type { VUser } from "@/lib/types"

export function ProfileView() {
  const user = useVL((s) => s.user)
  const logout = useVL((s) => s.logout)
  const setUser = useVL((s) => s.setUser)
  const [locating, setLocating] = useState(false)

  if (!user) return null

  async function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation not supported")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await apiFetch<{ user: VUser }>("/api/users", {
            method: "PUT",
            json: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          })
          setUser(res.user)
          toast.success("Ubicación actualizada")
        } catch {
          toast.error("Error al actualizar ubicación")
        } finally {
          setLocating(false)
        }
      },
      () => {
        toast.error("Permiso de ubicación denegado")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const roleMeta = ROLES.find((r) => r.id === user.role)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Profile header */}
      <div
        className="rounded-2xl p-5 mb-4 relative overflow-hidden"
        style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
      >
        <div
          className="pointer-events-none absolute -top-20 -right-10 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: user.avatarColor }}
        />
        <div className="relative flex items-center gap-4">
          <Avatar user={user} size={64} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold truncate" style={{ color: VL_COLORS.text }}>
              {user.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <RoleBadge role={user.role} />
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize"
                style={{ background: `${VL_COLORS.accent}18`, color: VL_COLORS.accent }}
              >
                Plan {user.plan}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="relative grid grid-cols-3 gap-2 mt-4">
          <MiniStat
            icon={<BatteryFull size={13} />}
            label="Batería"
            value={`${user.battery}%`}
            color={user.battery > 50 ? VL_COLORS.green : user.battery > 20 ? VL_COLORS.amber : VL_COLORS.red}
          />
          <MiniStat
            icon={<Wifi size={13} />}
            label="Estado"
            value={user.status === "online" ? "En línea" : user.status === "busy" ? "Ocupado" : "Desconectado"}
            color={user.status === "online" ? VL_COLORS.green : VL_COLORS.text3}
          />
          <MiniStat
            icon={<ShieldCheck size={13} />}
            label="Rol"
            value={roleMeta?.name ?? user.role}
            color={roleMeta?.color ?? VL_COLORS.accent}
          />
        </div>
      </div>

      {/* Details */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: VL_COLORS.text }}>
          Información de la cuenta
        </h3>
        <div className="space-y-3">
          <Row icon={<Mail size={14} />} label="Email" value={user.email} />
          <Row
            icon={<Globe size={14} />}
            label="Idioma"
            value="Español (Chile) · es-CL"
          />
          <Row icon={<MapPin size={14} />} label="Sector" value={user.sector || "No definido"} />
          <Row
            icon={<MapPin size={14} />}
            label="Coordenadas"
            value={
              user.lat && user.lng
                ? `${user.lat.toFixed(4)}, ${user.lng.toFixed(4)}`
                : "No disponible"
            }
          />
        </div>

        <button
          onClick={locate}
          disabled={locating}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-60"
          style={{ background: `${VL_COLORS.accent}18`, color: VL_COLORS.accent }}
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          {locating ? "Ubicando…" : "Actualizar mi ubicación GPS"}
        </button>
      </div>

      {/* PTT settings info */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}22` }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: VL_COLORS.text }}>
          Atajos PTT
        </h3>
        <div className="space-y-2 text-xs" style={{ color: VL_COLORS.text2 }}>
          <div className="flex items-center justify-between">
            <span>Hablar (mantener)</span>
            <Kbd>Espacio</Kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Botón PTT (mantener)</span>
            <Kbd>Clic / Toque</Kbd>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
        style={{ background: `${VL_COLORS.red}12`, color: VL_COLORS.red, border: `0.5px solid ${VL_COLORS.red}33` }}
      >
        <LogOut size={15} /> Cerrar sesión
      </button>

      <p className="text-center text-[11px] mt-5" style={{ color: VL_COLORS.text3 }}>
        VoiceLink · Android, iOS &amp; Web · v1.0
      </p>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: VL_COLORS.text3 }}>{icon}</span>
      <span className="text-xs w-28 shrink-0" style={{ color: VL_COLORS.text3 }}>
        {label}
      </span>
      <span className="text-xs font-medium truncate" style={{ color: VL_COLORS.text }}>
        {value}
      </span>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: VL_COLORS.bg3 }}>
      <div className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color }}>
        {icon}
        <span style={{ color: VL_COLORS.text3 }}>{label}</span>
      </div>
      <div className="text-xs font-bold truncate" style={{ color: VL_COLORS.text }}>
        {value}
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-mono"
      style={{ background: VL_COLORS.bg4, color: VL_COLORS.text2, border: `0.5px solid ${VL_COLORS.text3}44` }}
    >
      {children}
    </span>
  )
}
