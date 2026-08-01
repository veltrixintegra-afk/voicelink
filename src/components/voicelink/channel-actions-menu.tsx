"use client"

import { useState, useEffect } from "react"
import {
  MoreVertical,
  Pencil,
  Users as UsersIcon,
  Trash2,
  Radio,
  Shield,
  Truck,
  Briefcase,
  Users,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { VL_COLORS, type ChannelIcon } from "@/lib/constants"
import type { VChannel, VUser } from "@/lib/types"
import { useVL } from "@/store/use-voicelink"
import { apiFetch } from "@/lib/api"
import { Avatar, RoleBadge } from "./shared"
import { toast } from "sonner"

const ICONS: { id: ChannelIcon; label: string; icon: LucideIcon }[] = [
  { id: "radio", label: "General", icon: Radio },
  { id: "shield", label: "Seguridad", icon: Shield },
  { id: "truck", label: "Logística", icon: Truck },
  { id: "briefcase", label: "Ejecutivo", icon: Briefcase },
  { id: "users", label: "Equipo", icon: Users },
  { id: "alert", label: "Alertas", icon: AlertTriangle },
]

export function ChannelActionsMenu({ channel }: { channel: VChannel }) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const updateChannel = useVL((s) => s.updateChannel)
  const removeChannel = useVL((s) => s.removeChannel)
  const users = useVL((s) => s.users)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ color: VL_COLORS.text2 }}
            aria-label="Opciones del canal"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-0"
          style={{ background: VL_COLORS.bg3, color: VL_COLORS.text }}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="gap-2 cursor-pointer focus:bg-[var(--vl-bg4)]"
            onClick={() => setRenameOpen(true)}
          >
            <Pencil size={13} style={{ color: VL_COLORS.accent }} />
            Renombrar canal
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 cursor-pointer focus:bg-[var(--vl-bg4)]"
            onClick={() => setMembersOpen(true)}
          >
            <UsersIcon size={13} style={{ color: VL_COLORS.accent2 }} />
            Asignar usuarios
          </DropdownMenuItem>
          {channel.id !== "general" && (
            <>
              <DropdownMenuSeparator style={{ background: VL_COLORS.bg4 }} />
              <DropdownMenuItem
                className="gap-2 cursor-pointer focus:bg-[var(--vl-bg4)]"
                style={{ color: VL_COLORS.red }}
                onClick={() => {
                  if (confirm(`¿Eliminar canal "${channel.name}" permanentemente?`)) {
                    void deleteChannel(channel)
                  }
                }}
              >
                <Trash2 size={13} />
                Eliminar canal
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        channel={channel}
        onSaved={(patch) => updateChannel(channel.id, patch)}
      />
      <MembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        channel={channel}
        users={users}
        onSaved={(members) => updateChannel(channel.id, { members })}
      />
    </>
  )

  async function deleteChannel(c: VChannel) {
    try {
      await apiFetch(`/api/channels?id=${c.id}`, { method: "DELETE" })
      removeChannel(c.id)
      toast.success(`Canal "${c.name}" eliminado`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar")
    }
  }
}

function RenameDialog({
  open,
  onOpenChange,
  channel,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  channel: VChannel
  onSaved: (patch: Partial<VChannel>) => void
}) {
  const [name, setName] = useState(channel.name)
  const [description, setDescription] = useState(channel.description)
  const [icon, setIcon] = useState<ChannelIcon>(channel.icon)
  const [loading, setLoading] = useState(false)

  // Reset fields when the dialog opens
  useEffect(() => {
    if (open) {
      setName(channel.name)
      setDescription(channel.description)
      setIcon(channel.icon)
    }
  }, [open, channel.id, channel.name, channel.description, channel.icon])

  async function save() {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío")
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch<{ channel: VChannel }>("/api/channels", {
        method: "PUT",
        json: { id: channel.id, name, description, icon },
      })
      onSaved({
        name: res.channel.name,
        label: res.channel.label,
        description: res.channel.description,
        icon: res.channel.icon,
      })
      toast.success(`Canal renombrado a "${res.channel.name}"`)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al renombrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0" style={{ background: VL_COLORS.bg2, color: VL_COLORS.text }}>
        <DialogHeader>
          <DialogTitle>Cambiar el nombre del canal</DialogTitle>
          <DialogDescription style={{ color: VL_COLORS.text2 }}>
            Renombra y configura el canal. Los cambios se reflejan en todos los paneles.
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
              placeholder="Nombre del canal"
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
                      background: active ? `${channel.color}22` : VL_COLORS.bg3,
                      border: active ? `1px solid ${channel.color}` : `0.5px solid ${VL_COLORS.text3}22`,
                      color: active ? channel.color : VL_COLORS.text2,
                    }}
                    title={it.label}
                  >
                    <Cmp size={15} />
                  </button>
                )
              })}
            </div>
          </div>
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
            onClick={save}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: channel.color, color: "#fff" }}
          >
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MembersDialog({
  open,
  onOpenChange,
  channel,
  users,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  channel: VChannel
  users: VUser[]
  onSaved: (members: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(channel.members))
  const [loading, setLoading] = useState(false)

  // Sync selection when the dialog opens
  useEffect(() => {
    if (open) {
      setSelected(new Set(channel.members))
    }
  }, [open, channel.id, channel.members])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    setLoading(true)
    try {
      const members = Array.from(selected)
      const res = await apiFetch<{ channel: VChannel }>("/api/channels", {
        method: "PUT",
        json: { id: channel.id, members },
      })
      onSaved(res.channel.members)
      toast.success(`${res.channel.members.length} usuarios asignados a "${res.channel.name}"`)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al asignar usuarios")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 max-w-md" style={{ background: VL_COLORS.bg2, color: VL_COLORS.text }}>
        <DialogHeader>
          <DialogTitle>Miembros del canal</DialogTitle>
          <DialogDescription style={{ color: VL_COLORS.text2 }}>
            Asigna usuarios a "{channel.name}". Podrán enviar y recibir mensajes PTT aquí.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs" style={{ color: VL_COLORS.text3 }}>
              {selected.size} de {users.length} seleccionados
            </span>
            <button
              onClick={() => setSelected(new Set(users.map((u) => u.id)))}
              className="text-[11px] hover:underline"
              style={{ color: VL_COLORS.accent }}
            >
              Seleccionar todos
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto vl-scroll space-y-1 rounded-lg p-1" style={{ background: VL_COLORS.bg3 }}>
            {users.length === 0 && (
              <div className="text-[11px] p-3 text-center" style={{ color: VL_COLORS.text3 }}>
                Cargando usuarios…
              </div>
            )}
            {users.map((u) => {
              const checked = selected.has(u.id)
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-[var(--vl-bg4)] transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(u.id)}
                    className="border-[var(--vl-text3)] data-[state=checked]:bg-[var(--vl-accent)] data-[state=checked]:border-[var(--vl-accent)]"
                  />
                  <Avatar user={u} size={28} showStatus={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: VL_COLORS.text }}>
                      {u.name}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: VL_COLORS.text3 }}>
                      {u.email}
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </label>
              )
            })}
          </div>
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
            onClick={save}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: channel.color, color: "#fff" }}
          >
            {loading ? "Asignando…" : `Asignar ${selected.size} usuario(s)`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
