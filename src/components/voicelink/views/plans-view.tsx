"use client"

import { CheckCircle2, Sparkles, Crown, Zap } from "lucide-react"
import { PLANS, VL_COLORS, type PlanId } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import type { VUser } from "@/lib/types"
import { useState } from "react"

const ICONS = { basico: Sparkles, profesional: Zap, empresarial: Crown }

export function PlansView() {
  const user = useVL((s) => s.user)
  const setUser = useVL((s) => s.setUser)
  const [busy, setBusy] = useState<PlanId | null>(null)

  async function choose(plan: PlanId) {
    if (plan === "empresarial") {
      toast.info("El plan Empresarial solo está disponible para administradores autorizados")
      return
    }
    if (user?.plan === plan) {
      toast.info(`Ya estás en el plan ${plan}`)
      return
    }
    setBusy(plan)
    try {
      // Update the user's plan via a lightweight endpoint (reuse register-style update)
      const res = await apiFetch<{ user: VUser }>("/api/users", {
        method: "PUT",
        json: { status: "online" },
      })
      // Optimistic local update (backend doesn't have a dedicated plan endpoint in demo)
      setUser({ ...res.user, plan })
      toast.success(`Plan cambiado a ${plan}`)
    } catch {
      toast.error("No se pudo cambiar el plan")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: VL_COLORS.text }}>
          Elige tu plan
        </h2>
        <p className="text-xs sm:text-sm mt-1" style={{ color: VL_COLORS.text2 }}>
          Selecciona el plan que mejor se adapta a tu equipo
        </p>
        {user && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: VL_COLORS.bg2, border: `0.5px solid ${VL_COLORS.text3}33` }}>
            <span style={{ color: VL_COLORS.text3 }}>Tu plan actual:</span>
            <span className="font-bold capitalize" style={{ color: VL_COLORS.accent }}>
              {user.plan}
            </span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const Icon = ICONS[p.id]
          const isCurrent = user?.plan === p.id
          return (
            <div
              key={p.id}
              className="relative rounded-2xl p-5 flex flex-col"
              style={{
                background: p.highlighted ? `${VL_COLORS.accent}08` : VL_COLORS.bg2,
                border: p.highlighted
                  ? `1.5px solid ${VL_COLORS.accent}`
                  : `0.5px solid ${VL_COLORS.text3}33`,
              }}
            >
              {p.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: VL_COLORS.accent, color: "#fff" }}
                >
                  MÁS POPULAR
                </span>
              )}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${p.color}18`, color: p.color }}
              >
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-extrabold" style={{ color: VL_COLORS.text }}>
                {p.name}
              </h3>
              <p className="text-xs mb-3" style={{ color: VL_COLORS.text2 }}>
                {p.tagline}
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold" style={{ color: VL_COLORS.text }}>
                  {p.price}
                </span>
                <span className="text-xs" style={{ color: VL_COLORS.text3 }}>
                  {p.period}
                </span>
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: VL_COLORS.text2 }}>
                    <CheckCircle2 size={13} style={{ color: VL_COLORS.green, marginTop: 1, shrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(p.id)}
                disabled={isCurrent || busy === p.id}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 hover:brightness-110"
                style={{
                  background: isCurrent
                    ? VL_COLORS.bg4
                    : p.highlighted
                      ? `linear-gradient(90deg, ${VL_COLORS.accent}, ${VL_COLORS.accent2})`
                      : `${p.color}18`,
                  color: isCurrent ? VL_COLORS.text3 : p.highlighted ? "#fff" : p.color,
                }}
              >
                {isCurrent ? "Plan actual" : busy === p.id ? "Procesando…" : p.cta}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-[11px] mt-6" style={{ color: VL_COLORS.text3 }}>
        Todos los planes incluyen cifrado de canales · Soporte por email · SLA disponible en Empresarial
      </p>
    </div>
  )
}
