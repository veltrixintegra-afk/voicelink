// VoiceLink — design tokens, plans, channels, integrations
// Recreated from the original VoiceLink APK (ia.z.voicelink)

export const VL_COLORS = {
  bg: "#0e0f14",
  bg2: "#161820",
  bg3: "#1e2028",
  bg4: "#252832",
  accent: "#4f6ef7",
  accent2: "#7c5cf7",
  green: "#22c97a",
  red: "#f04a58",
  amber: "#f5a623",
  text: "#e8eaf0",
  text2: "#8b8fa8",
  text3: "#4e5268",
} as const

export type PlanId = "basico" | "profesional" | "empresarial"

export interface Plan {
  id: PlanId
  name: string
  price: string
  period: string
  tagline: string
  color: string
  features: string[]
  cta: string
  highlighted?: boolean
}

export const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    price: "$0",
    period: "/mes",
    tagline: "Para empezar a comunicar",
    color: VL_COLORS.text2,
    features: [
      "5 usuarios máximo",
      "Transcripción IA (50/mes)",
      "Mensajes y canales",
      "Mapa + geolocalización",
      "Sin historial avanzado",
      "Sin integraciones",
      "Sin panel admin",
    ],
    cta: "Comenzar gratis",
  },
  {
    id: "profesional",
    name: "Profesional",
    price: "$29",
    period: "/mes",
    tagline: "Para equipos en movimiento",
    color: VL_COLORS.accent,
    features: [
      "25 usuarios incluidos",
      "Transcripción IA ilimitada",
      "Whisper IA + acciones automáticas",
      "Historial y búsqueda avanzada",
      "Integraciones (WhatsApp, Email)",
      "Mapa en tiempo real",
      "Equipos y canales",
    ],
    cta: "Elegir Profesional",
    highlighted: true,
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: "Custom",
    period: "",
    tagline: "Para organizaciones grandes",
    color: VL_COLORS.accent2,
    features: [
      "Usuarios ilimitados",
      "Canales ilimitados",
      "Todas las integraciones",
      "Panel administrativo",
      "Control administrativo del sistema",
      "Gerente de cuenta dedicado",
      "SLA y soporte prioritario",
    ],
    cta: "Contactar ventas",
  },
]

export type ChannelIcon = "radio" | "shield" | "truck" | "briefcase" | "users" | "alert"

export interface ChannelSeed {
  id: string
  name: string
  label: string
  description: string
  icon: ChannelIcon
  color: string
}

export const CHANNEL_SEEDS: ChannelSeed[] = [
  {
    id: "general",
    name: "Canal general",
    label: "general",
    description: "Comunicación general del equipo",
    icon: "radio",
    color: VL_COLORS.accent,
  },
  {
    id: "supervisor",
    name: "Canal supervisor",
    label: "supervisor",
    description: "Coordinación de supervisores",
    icon: "users",
    color: VL_COLORS.accent2,
  },
  {
    id: "guardia",
    name: "Canal guardias",
    label: "guardia",
    description: "Guardias de seguridad en ronda",
    icon: "shield",
    color: VL_COLORS.green,
  },
  {
    id: "logistica",
    name: "Canal logística",
    label: "logistica",
    description: "Movimiento y logística",
    icon: "truck",
    color: VL_COLORS.amber,
  },
  {
    id: "ejecutivo",
    name: "Canal ejecutivo",
    label: "ejecutivo",
    description: "Comité ejecutivo",
    icon: "briefcase",
    color: VL_COLORS.red,
  },
]

export const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(
  CHANNEL_SEEDS.map((c) => [c.label, c.name]),
)

export type IntegrationId =
  | "whatsapp"
  | "email"
  | "telegram"
  | "slack"
  | "webhook"

export interface IntegrationMeta {
  id: IntegrationId
  name: string
  color: string
  description: string
}

export const INTEGRATION_META: Record<IntegrationId, IntegrationMeta> = {
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    color: "#25D366",
    description: "Enviar por WhatsApp",
  },
  email: {
    id: "email",
    name: "Email",
    color: "#4f6ef7",
    description: "Enviar por Email",
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    color: "#229ED9",
    description: "Enviar por Telegram",
  },
  slack: {
    id: "slack",
    name: "Slack",
    color: "#E01E5A",
    description: "Enviar a Slack",
  },
  webhook: {
    id: "webhook",
    name: "Webhook",
    color: "#7c5cf7",
    description: "Disparar webhook",
  },
}

export const ROLES = [
  { id: "operador", name: "Operador", color: VL_COLORS.text2 },
  { id: "supervisor", name: "Supervisor", color: VL_COLORS.accent },
  { id: "administrador", name: "Administrador", color: VL_COLORS.accent2 },
  { id: "guardia", name: "Guardia de seguridad", color: VL_COLORS.green },
] as const

// Intent → automated action patterns (used client-side as a fast fallback,
// the backend /api/intent also uses the LLM for richer detection).
export const INTENT_PATTERNS: { pattern: RegExp; type: string; label: string; integration?: IntegrationId }[] = [
  { pattern: /alerta|emergencia|ayuda|socorro|fuego|incendio|robo|intruso|peligro/i, type: "alert", label: "Alerta de emergencia" },
  { pattern: /whatsapp|wsp|guatsap/i, type: "send_whatsapp", label: "Enviar por WhatsApp", integration: "whatsapp" },
  { pattern: /correo|email|mail|env[íi]a.*correo/i, type: "send_email", label: "Enviar por Email", integration: "email" },
  { pattern: /telegram/i, type: "send_telegram", label: "Enviar por Telegram", integration: "telegram" },
  { pattern: /slack/i, type: "send_slack", label: "Enviar a Slack", integration: "slack" },
  { pattern: /ubicaci[óo]n|posici[óo]n|gps|d[óo]nde estoy|mi ubicaci[óo]n/i, type: "share_location", label: "Compartir ubicación GPS" },
  { pattern: /reporte|informe|reportar/i, type: "report", label: "Generar reporte" },
]

export const TAGLINE = "Habla. Transcribe. Actúa."
export const APP_NAME = "VoiceLink"
