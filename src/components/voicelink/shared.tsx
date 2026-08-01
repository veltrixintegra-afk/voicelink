"use client"

import {
  Radio,
  Shield,
  Truck,
  Briefcase,
  Users,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import type { ChannelIcon } from "@/lib/constants"
import { VL_COLORS } from "@/lib/constants"
import type { VUser } from "@/lib/types"

const ICONS: Record<ChannelIcon, LucideIcon> = {
  radio: Radio,
  shield: Shield,
  truck: Truck,
  briefcase: Briefcase,
  users: Users,
  alert: AlertTriangle,
}

export function ChannelIconRender({
  icon,
  size = 16,
  color,
}: {
  icon: ChannelIcon
  size?: number
  color?: string
}) {
  const Cmp = ICONS[icon] ?? Radio
  return <Cmp size={size} style={{ color: color ?? VL_COLORS.accent }} />
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  user,
  size = 36,
  showStatus = true,
}: {
  user: { name: string; avatarColor: string; status?: string }
  size?: number
  showStatus?: boolean
}) {
  const statusColor =
    user.status === "online"
      ? VL_COLORS.green
      : user.status === "busy"
        ? VL_COLORS.amber
        : VL_COLORS.text3
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold w-full h-full"
        style={{
          background: `${user.avatarColor}22`,
          color: user.avatarColor,
          fontSize: size * 0.36,
          border: `1px solid ${user.avatarColor}44`,
        }}
      >
        {initials(user.name)}
      </div>
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: size * 0.32,
            height: size * 0.32,
            background: statusColor,
            border: `2px solid ${VL_COLORS.bg}`,
          }}
        />
      )}
    </div>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string }> = {
    operador: { label: "Operador", color: VL_COLORS.text2 },
    supervisor: { label: "Supervisor", color: VL_COLORS.accent },
    administrador: { label: "Admin", color: VL_COLORS.accent2 },
    guardia: { label: "Guardia", color: VL_COLORS.green },
  }
  const m = map[role] ?? map.operador
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ background: `${m.color}18`, color: m.color }}
    >
      {m.label}
    </span>
  )
}

export { VL_COLORS }
export type { VUser }
