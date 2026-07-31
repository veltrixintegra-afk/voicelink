"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Navigation, BatteryFull, Crosshair, Loader2 } from "lucide-react"
import { VL_COLORS } from "@/lib/constants"
import { useVL } from "@/store/use-voicelink"
import { Avatar, RoleBadge } from "../shared"
import { apiFetch } from "@/lib/api"
import type { VUser } from "@/lib/types"
import { toast } from "sonner"

export function MapView() {
  const users = useVL((s) => s.users)
  const user = useVL((s) => s.user)
  const setUser = useVL((s) => s.setUser)
  const [locating, setLocating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  // Collect all points (team + current user)
  const points = users.filter((u) => typeof u.lat === "number" && typeof u.lng === "number")
  if (user?.lat && user?.lng && !points.find((p) => p.id === user.id)) {
    points.push(user)
  }

  // Compute projection bounds around the cluster
  const lats = points.map((p) => p.lat as number)
  const lngs = points.map((p) => p.lng as number)
  const hasPoints = points.length > 0
  const minLat = hasPoints ? Math.min(...lats) - 0.01 : -33.47
  const maxLat = hasPoints ? Math.max(...lats) + 0.01 : -33.43
  const minLng = hasPoints ? Math.min(...lngs) - 0.01 : -70.68
  const maxLng = hasPoints ? Math.max(...lngs) + 0.01 : -70.65

  const W = 1000
  const H = 640
  const pad = 60
  const project = (lat: number, lng: number) => {
    const x = pad + ((lng - minLng) / (maxLng - minLng || 1)) * (W - pad * 2)
    const y = pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (H - pad * 2)
    return { x, y }
  }

  function locateMe() {
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
          toast.success("Ubicación actualizada en el mapa")
        } catch {
          toast.error("No se pudo iniciar el seguimiento de ubicación")
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        toast.error("Permiso de ubicación denegado")
        console.warn("[VoiceLink] Web GPS error:", err.message)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }

  // Auto-watch position for live tracking
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await apiFetch("/api/users", {
            method: "PUT",
            json: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          })
        } catch {
          /* ignore */
        }
      },
      (err) => console.warn("[VoiceLink] watchPosition error:", err.message),
      { enableHighAccuracy: true, maximumAge: 15000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  const selectedUser = selected ? users.find((u) => u.id === selected) || user : null

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Map */}
      <div className="relative flex-1 min-h-[360px] overflow-hidden" style={{ background: VL_COLORS.bg2 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Grid */}
          <defs>
            <pattern id="vl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={VL_COLORS.bg4} strokeWidth="0.5" />
            </pattern>
            <radialGradient id="vl-radar-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={VL_COLORS.accent} stopOpacity="0.25" />
              <stop offset="70%" stopColor={VL_COLORS.accent} stopOpacity="0.05" />
              <stop offset="100%" stopColor={VL_COLORS.accent} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="vl-river" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0e1f33" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={VL_COLORS.bg2} />
          <rect width={W} height={H} fill="url(#vl-grid)" />

          {/* Stylized "river" / avenue */}
          <path
            d={`M -20 ${H * 0.62} Q ${W * 0.3} ${H * 0.5} ${W * 0.55} ${H * 0.66} T ${W + 20} ${H * 0.7}`}
            fill="none"
            stroke="url(#vl-river)"
            strokeWidth="46"
            strokeLinecap="round"
          />
          {/* Avenues */}
          <line x1={W * 0.5} y1="0" x2={W * 0.5} y2={H} stroke={VL_COLORS.bg4} strokeWidth="3" />
          <line x1="0" y1={H * 0.35} x2={W} y2={H * 0.35} stroke={VL_COLORS.bg4} strokeWidth="3" />

          {/* Sector labels */}
          <text x={W * 0.18} y={H * 0.2} fill={VL_COLORS.text3} fontSize="13" fontFamily="DM Sans, sans-serif" opacity="0.7">Providencia</text>
          <text x={W * 0.62} y={H * 0.22} fill={VL_COLORS.text3} fontSize="13" fontFamily="DM Sans, sans-serif" opacity="0.7">Las Condes</text>
          <text x={W * 0.2} y={H * 0.78} fill={VL_COLORS.text3} fontSize="13" fontFamily="DM Sans, sans-serif" opacity="0.7">Maipú</text>
          <text x={W * 0.7} y={H * 0.82} fill={VL_COLORS.text3} fontSize="13" fontFamily="DM Sans, sans-serif" opacity="0.7">Ñuñoa</text>

          {/* Radar around current user */}
          {user?.lat && user?.lng && (
            <g>
              {(() => {
                const { x, y } = project(user.lat, user.lng)
                return (
                  <>
                    <circle cx={x} cy={y} r="120" fill="url(#vl-radar-grad)" />
                    <g className="vl-radar" style={{ transformOrigin: `${x}px ${y}px` }}>
                      <path d={`M ${x} ${y} L ${x + 120} ${y} A 120 120 0 0 1 ${x + 85} ${y + 85} Z`} fill={VL_COLORS.accent} opacity="0.18" />
                    </g>
                  </>
                )
              })()}
            </g>
          )}

          {/* Markers */}
          {points.map((p) => {
            const { x, y } = project(p.lat as number, p.lng as number)
            const isMe = p.id === user?.id
            const statusColor =
              p.status === "online" ? VL_COLORS.green : p.status === "busy" ? VL_COLORS.amber : VL_COLORS.text3
            return (
              <g
                key={p.id}
                onClick={() => setSelected(isMe ? null : p.id)}
                style={{ cursor: isMe ? "default" : "pointer" }}
              >
                <circle cx={x} cy={y} r={isMe ? 18 : 14} fill={p.avatarColor} opacity="0.18" />
                <circle
                  cx={x}
                  cy={y}
                  r={isMe ? 11 : 9}
                  fill={p.avatarColor}
                  stroke={VL_COLORS.bg}
                  strokeWidth="2.5"
                />
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  fontSize={isMe ? "9" : "8"}
                  fill="#fff"
                  fontFamily="DM Sans, sans-serif"
                  fontWeight="700"
                >
                  {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </text>
                <circle cx={x + (isMe ? 8 : 6)} cy={y + (isMe ? 8 : 6)} r="3.5" fill={statusColor} stroke={VL_COLORS.bg} strokeWidth="1.5" />
                {selected === p.id && (
                  <text x={x} y={y - 18} textAnchor="middle" fontSize="11" fill={VL_COLORS.text} fontFamily="DM Sans, sans-serif" fontWeight="600">
                    {p.name}
                  </text>
                )}
              </g>
            )
          })}

          {/* Compass */}
          <g transform={`translate(${W - 70} 70)`}>
            <circle r="26" fill={VL_COLORS.bg3} stroke={VL_COLORS.text3} strokeWidth="0.5" opacity="0.9" />
            <text textAnchor="middle" y="-12" fontSize="10" fill={VL_COLORS.red} fontWeight="700" fontFamily="DM Sans, sans-serif">N</text>
            <text textAnchor="middle" y="20" fontSize="9" fill={VL_COLORS.text2} fontFamily="DM Sans, sans-serif">S</text>
            <line x1="0" y1="-8" x2="0" y2="8" stroke={VL_COLORS.red} strokeWidth="1.5" />
          </g>
        </svg>

        {/* Top-left badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${VL_COLORS.bg}cc`, border: `0.5px solid ${VL_COLORS.text3}22` }}>
          <Navigation size={12} style={{ color: VL_COLORS.accent }} />
          <span className="text-[11px] font-semibold" style={{ color: VL_COLORS.text2 }}>
            {points.length} unidades · Santiago
          </span>
        </div>

        {/* Locate button */}
        <button
          onClick={locateMe}
          disabled={locating}
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-60 hover:brightness-110 transition-all"
          style={{ background: VL_COLORS.accent, color: "#fff", boxShadow: `0 4px 16px ${VL_COLORS.accent}55` }}
          aria-label="Ubicar mi posición"
        >
          {locating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
        </button>

        {points.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <MapPin size={32} style={{ color: VL_COLORS.text3 }} />
            <p className="text-sm mt-2" style={{ color: VL_COLORS.text2 }}>Cargando mapa…</p>
          </div>
        )}
      </div>

      {/* Team panel */}
      <div
        className="w-full lg:w-[300px] shrink-0 flex flex-col"
        style={{ background: VL_COLORS.bg2, borderLeft: `0.5px solid ${VL_COLORS.text3}22` }}
      >
        <div className="p-3" style={{ borderBottom: `0.5px solid ${VL_COLORS.text3}22` }}>
          <span className="text-xs font-bold" style={{ color: VL_COLORS.text }}>
            Equipos y canales
          </span>
          <p className="text-[11px]" style={{ color: VL_COLORS.text3 }}>
            Comparte posición GPS con tu equipo
          </p>
        </div>
        <div className="flex-1 overflow-y-auto vl-scroll p-2 space-y-1 max-h-96 lg:max-h-none">
          {points.length === 0 && (
            <div className="text-[11px] p-2" style={{ color: VL_COLORS.text3 }}>
              Esperando ubicaciones…
            </div>
          )}
          {points.map((p) => {
            const isMe = p.id === user?.id
            return (
              <motion.button
                key={p.id}
                onClick={() => setSelected(isMe ? null : p.id)}
                whileHover={{ x: 2 }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors"
                style={{
                  background: selected === p.id ? `${VL_COLORS.accent}12` : "transparent",
                }}
              >
                <Avatar user={p} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate" style={{ color: VL_COLORS.text }}>
                      {p.name} {isMe && <span style={{ color: VL_COLORS.text3 }}>(tú)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: VL_COLORS.text3 }}>
                    <MapPin size={9} /> {p.sector || "—"}
                    <BatteryFull size={9} style={{ color: p.battery > 30 ? VL_COLORS.green : VL_COLORS.red }} />
                    {p.battery}%
                  </div>
                </div>
                <RoleBadge role={p.role} />
              </motion.button>
            )
          })}
        </div>

        {selectedUser && (
          <div className="p-3" style={{ borderTop: `0.5px solid ${VL_COLORS.text3}22` }}>
            <a
              href={`https://www.google.com/maps?q=${selectedUser.lat},${selectedUser.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
              style={{ background: `${VL_COLORS.accent}18`, color: VL_COLORS.accent }}
            >
              <MapPin size={12} /> Ver ubicación de {selectedUser.name}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
