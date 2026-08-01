"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  CheckCircle2,
  Radio,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import { Logo, Wordmark } from "./logo"
import { PLANS, VL_COLORS, TAGLINE } from "@/lib/constants"
import { apiFetch } from "@/lib/api"
import { useVL } from "@/store/use-voicelink"
import type { AuthResponse, PlanId } from "@/lib/types"
import { toast } from "sonner"

type Mode = "login" | "register"

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login")
  const [showPlans, setShowPlans] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("demo@voicelink.app")
  const [password, setPassword] = useState("voicelink")
  const [plan, setPlan] = useState<PlanId>("profesional")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const login = useVL((s) => s.login)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === "login") {
        const res = await apiFetch<AuthResponse>("/api/auth/login", {
          method: "POST",
          json: { email, password },
        })
        login(res.user, res.token)
        toast.success(`Bienvenido, ${res.user.name}`)
      } else {
        const res = await apiFetch<AuthResponse>("/api/auth/register", {
          method: "POST",
          json: { name, email, password, plan },
        })
        login(res.user, res.token)
        toast.success("Cuenta creada correctamente")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al ingresar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div
        className="relative flex flex-col justify-between p-6 sm:p-10 lg:w-[46%] lg:min-h-screen overflow-hidden"
        style={{ background: VL_COLORS.bg2 }}
      >
        <div
          className="pointer-events-none absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${VL_COLORS.accent}, transparent 60%)` }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${VL_COLORS.accent2}, transparent 60%)` }}
        />

        <div className="relative flex items-center gap-3">
          <Logo size={40} />
          <Wordmark size={22} />
        </div>

        <div className="relative my-10 lg:my-0">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: VL_COLORS.text }}
          >
            <span className="vl-gradient-text">Habla.</span> Transcribe.{" "}
            <span style={{ color: VL_COLORS.text2 }}>Actúa.</span>
          </motion.h1>
          <p
            className="mt-4 text-sm sm:text-base max-w-md leading-relaxed"
            style={{ color: VL_COLORS.text2 }}
          >
            Push-to-Talk inteligente con transcripción IA en tiempo real,
            geolocalización e integraciones multi-app. Android, iOS y Web.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            <FeaturePill icon={<Sparkles size={16} />} label="Whisper v3" sub="Transcripción IA" />
            <FeaturePill icon={<MapPin size={16} />} label="Mapa GPS" sub="Tiempo real" />
            <FeaturePill icon={<Radio size={16} />} label="PTT" sub="Push-to-Talk" />
            <FeaturePill icon={<ShieldCheck size={16} />} label="Seguridad" sub="Canales cifrados" />
          </div>
        </div>

        <div
          className="relative text-xs flex items-center gap-2"
          style={{ color: VL_COLORS.text3 }}
        >
          <span>VoiceLink · Android, iOS &amp; Web</span>
          <span className="vl-live-dot" style={{ color: VL_COLORS.green }}>
            ●
          </span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!showPlans ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-lg font-bold"
                    style={{ color: VL_COLORS.text }}
                  >
                    {mode === "login" ? "Ingresar" : "Crear cuenta nueva"}
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: VL_COLORS.text2 }}>
                  {mode === "login"
                    ? "VoiceLink · Habla. Transcribe. Actúa."
                    : "Únete a VoiceLink en segundos."}
                </p>

                {/* Tabs */}
                <div
                  className="grid grid-cols-2 p-1 rounded-xl mb-6"
                  style={{ background: VL_COLORS.bg2 }}
                >
                  {(["login", "register"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className="relative py-2 text-sm font-semibold rounded-lg transition-colors"
                      style={{
                        color: mode === m ? VL_COLORS.text : VL_COLORS.text2,
                      }}
                    >
                      {mode === m && (
                        <motion.span
                          layoutId="auth-tab"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: VL_COLORS.bg4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">
                        {m === "login" ? "Ingresar" : "Crear cuenta"}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} className="space-y-4">
                  {mode === "register" && (
                    <Field
                      icon={<UserIcon size={16} />}
                      label="Nombre"
                      type="text"
                      value={name}
                      onChange={setName}
                      placeholder="Tu nombre"
                      required
                    />
                  )}
                  <Field
                    icon={<Mail size={16} />}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="tu@email.com"
                    required
                  />
                  <div>
                    <label
                      className="text-xs font-medium mb-1.5 block"
                      style={{ color: VL_COLORS.text2 }}
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: VL_COLORS.text3 }}
                      >
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full rounded-xl py-2.5 pl-9 pr-10 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          background: VL_COLORS.bg2,
                          border: `0.5px solid ${VL_COLORS.text3}33`,
                          color: VL_COLORS.text,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: VL_COLORS.text3 }}
                        aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs hover:underline"
                        style={{ color: VL_COLORS.accent }}
                        onClick={() => toast.info("Contacta al administrador para restablecer tu contraseña")}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:brightness-110"
                    style={{
                      background: `linear-gradient(90deg, ${VL_COLORS.accent}, ${VL_COLORS.accent2})`,
                      color: "#fff",
                    }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogIn size={16} />
                    )}
                    {loading
                      ? "Procesando..."
                      : mode === "login"
                        ? "Ingresar"
                        : "Crear cuenta y comenzar"}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1" style={{ background: VL_COLORS.bg4 }} />
                  <span className="text-xs" style={{ color: VL_COLORS.text3 }}>o</span>
                  <div className="h-px flex-1" style={{ background: VL_COLORS.bg4 }} />
                </div>

                <button
                  type="button"
                  onClick={() => setShowPlans(true)}
                  className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    background: VL_COLORS.bg2,
                    border: `0.5px solid ${VL_COLORS.text3}33`,
                    color: VL_COLORS.text,
                  }}
                >
                  Ver planes y precios <ArrowRight size={14} />
                </button>

                <p className="mt-5 text-[11px] leading-relaxed text-center" style={{ color: VL_COLORS.text3 }}>
                  Al continuar aceptas los Términos y la Política de Privacidad
                  de VoiceLink. Mis datos serán tratados conforme a la Ley de
                  Protección de Datos Personales de Chile.
                </p>

                <div
                  className="mt-4 rounded-lg p-3 text-[11px] flex items-start gap-2"
                  style={{ background: `${VL_COLORS.accent}10`, color: VL_COLORS.text2 }}
                >
                  <CheckCircle2 size={14} style={{ color: VL_COLORS.green, marginTop: 1 }} />
                  <span>
                    <b style={{ color: VL_COLORS.text }}>Cuenta demo:</b> demo@voicelink.app · voicelink<br />
                    <b style={{ color: VL_COLORS.accent2 }}>Admin:</b> veltrixintegra@gmail.com · voicelink
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="plans"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <PlansPreview
                  selected={plan}
                  onSelect={(p) => {
                    setPlan(p)
                    setMode("register")
                    setShowPlans(false)
                  }}
                  onBack={() => setShowPlans(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function FeaturePill({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-2.5"
      style={{
        background: VL_COLORS.bg3,
        border: `0.5px solid ${VL_COLORS.text3}22`,
      }}
    >
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `${VL_COLORS.accent}22`, color: VL_COLORS.accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: VL_COLORS.text }}>
          {label}
        </div>
        <div className="text-[10px] truncate" style={{ color: VL_COLORS.text3 }}>
          {sub}
        </div>
      </div>
    </div>
  )
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: React.ReactNode
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
}) {
  return (
    <div>
      <label
        className="text-xs font-medium mb-1.5 block"
        style={{ color: VL_COLORS.text2 }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: VL_COLORS.text3 }}
        >
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2"
          style={{
            background: VL_COLORS.bg2,
            border: `0.5px solid ${VL_COLORS.text3}33`,
            color: VL_COLORS.text,
          }}
        />
      </div>
    </div>
  )
}

function PlansPreview({
  selected,
  onSelect,
  onBack,
}: {
  selected: PlanId
  onSelect: (p: PlanId) => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg font-bold" style={{ color: VL_COLORS.text }}>
          Elige tu plan
        </span>
        <button
          onClick={onBack}
          className="text-xs hover:underline"
          style={{ color: VL_COLORS.text2 }}
        >
          ← Volver
        </button>
      </div>
      <p className="text-sm mb-5" style={{ color: VL_COLORS.text2 }}>
        Selecciona el plan que mejor se adapta a tu equipo
      </p>

      <div className="space-y-3">
        {PLANS.map((p) => {
          const active = selected === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full text-left rounded-xl p-4 transition-all"
              style={{
                background: active ? `${p.color}12` : VL_COLORS.bg2,
                border: active
                  ? `1.5px solid ${p.color}`
                  : `0.5px solid ${VL_COLORS.text3}33`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${p.color}22`, color: p.color }}
                  >
                    <Sparkles size={14} />
                  </span>
                  <span className="font-bold" style={{ color: VL_COLORS.text }}>
                    {p.name}
                  </span>
                  {p.highlighted && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: `${VL_COLORS.accent}22`, color: VL_COLORS.accent }}
                    >
                      Popular
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold" style={{ color: VL_COLORS.text }}>
                    {p.price}
                  </span>
                  <span className="text-xs" style={{ color: VL_COLORS.text3 }}>
                    {p.period}
                  </span>
                </div>
              </div>
              <p className="text-xs mb-2" style={{ color: VL_COLORS.text2 }}>
                {p.tagline}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {p.features.slice(0, 4).map((f, i) => (
                  <span key={i} className="text-[11px] flex items-center gap-1" style={{ color: VL_COLORS.text2 }}>
                    <CheckCircle2 size={11} style={{ color: VL_COLORS.green }} /> {f}
                  </span>
                ))}
                {p.features.length > 4 && (
                  <span className="text-[11px]" style={{ color: VL_COLORS.text3 }}>
                    +{p.features.length - 4} más
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
