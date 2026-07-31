"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Radio, Shield, Truck, Briefcase, Users, AlertTriangle } from "lucide-react"
import { VL_COLORS, type ChannelIcon } from "@/lib/constants"
import { apiFetch } from "@/lib/api"
import { useVL } from "@/store/use-voicelink"
import { toast } from "sonner"
import type { VChannel } from "@/lib/types"

const ICONS: { id: ChannelIcon; label: string; icon: typeof Radio }[] = [
  { id: "radio", label: "General", icon: Radio },
  { id: "shield", label: "Seguridad", icon: Shield },
  { id: "truck", label: "Logística", icon: Truck },
  { id: "briefcase", label: "Ejecutivo", icon: Briefcase },
  { id: "users", label: "Equipo", icon: Users },
  { id: "alert", label: "Alertas", icon: AlertTriangle },
]

export function CreateChannelDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState<ChannelIcon>("radio")
  const [hasPassword, setHasPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const addChannel = useVL((s) => s.addChannel)

  async function create() {
    if (!name.trim()) {
      toast.error("Ingresa el nombre del canal")
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch<{ channel: VChannel }>("/api/channels", {
        method: "POST",
        json: { name, description, icon, hasPassword, password },
      })
      addChannel(res.channel)
      toast.success(`Canal "${res.channel.name}" creado`)
      setName("")
      setDescription("")
      setHasPassword(false)
      setPassword("")
      setIcon("radio")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear canal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0"
        style={{ background: VL_COLORS.bg2, color: VL_COLORS.text }}
      >
        <DialogHeader>
          <DialogTitle>Nuevo canal</DialogTitle>
          <DialogDescription style={{ color: VL_COLORS.text2 }}>
            Crea un canal de comunicación PTT para tu equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: VL_COLORS.text2 }}>
              Nombre del canal
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Ronda nocturna"
              className="w-full rounded-lg py-2 px-3 text-sm outline-none"
              style={{ background: VL_COLORS.bg3, border: `0.5px solid ${VL_COLORS.text3}33`, color: VL_COLORS.text }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: VL_COLORS.text2 }}>
              Descripción
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción"
              className="w-full rounded-lg py-2 px-3 text-sm outline-none"
              style={{ background: VL_COLORS.bg3, border: `0.5px solid ${VL_COLORS.text3}33`, color: VL_COLORS.text }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: VL_COLORS.text2 }}>
              Ícono
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((it) => {
                const Cmp = it.icon
                const active = icon === it.id
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setIcon(it.id)}
                    className="aspect-square rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: active ? `${VL_COLORS.accent}22` : VL_COLORS.bg3,
                      border: active ? `1px solid ${VL_COLORS.accent}` : `0.5px solid ${VL_COLORS.text3}22`,
                      color: active ? VL_COLORS.accent : VL_COLORS.text2,
                    }}
                    title={it.label}
                  >
                    <Cmp size={16} />
                  </button>
                )
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPassword}
              onChange={(e) => setHasPassword(e.target.checked)}
              className="accent-[var(--vl-accent)]"
            />
            <span className="text-xs" style={{ color: VL_COLORS.text2 }}>
              Proteger con contraseña
            </span>
          </label>
          {hasPassword && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña del canal"
              type="text"
              className="w-full rounded-lg py-2 px-3 text-sm outline-none"
              style={{ background: VL_COLORS.bg3, border: `0.5px solid ${VL_COLORS.text3}33`, color: VL_COLORS.text }}
            />
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: VL_COLORS.bg3, color: VL_COLORS.text2 }}
          >
            Cancelar
          </button>
          <button
            onClick={create}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: VL_COLORS.accent, color: "#fff" }}
          >
            {loading ? "Creando..." : " Crear canal"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
