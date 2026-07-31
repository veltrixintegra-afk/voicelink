// VoiceLink — lightweight auth + seeding helpers (server-side)
import { db } from "@/lib/db"
import { CHANNEL_SEEDS, VL_COLORS, ROLES } from "@/lib/constants"
import type { VChannel, VUser } from "@/lib/types"

// Simple, non-cryptographic password hash (demo only — not for production).
// Using Web Crypto would require async; this keeps the demo self-contained.
export function hashPassword(pw: string): string {
  let h = 0
  const salted = `voicelink::${pw}::v1`
  for (let i = 0; i < salted.length; i++) {
    h = (Math.imul(31, h) + salted.charCodeAt(i)) | 0
  }
  return `vl1$${(h >>> 0).toString(16)}`
}

export function verifyPassword(pw: string, hash: string): boolean {
  return hashPassword(pw) === hash
}

export function makeToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`
  return Buffer.from(payload).toString("base64")
}

export function parseToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [uid] = decoded.split(".")
    return uid || null
  } catch {
    return null
  }
}

export async function getUserFromAuth(
  authHeader: string | null,
): Promise<VUser | null> {
  if (!authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, "")
  const uid = parseToken(token)
  if (!uid) return null
  const u = await db.user.findUnique({ where: { id: uid } })
  if (!u) return null
  return toVUser(u)
}

export function toVUser(u: {
  id: string
  name: string
  email: string
  role: string
  plan: string
  status: string
  battery: number
  lat: number | null
  lng: number | null
  sector: string | null
  avatarColor: string
  lastSeen: Date
}): VUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as VUser["role"],
    plan: u.plan as VUser["plan"],
    status: u.status as VUser["status"],
    battery: u.battery,
    lat: u.lat ?? undefined,
    lng: u.lng ?? undefined,
    sector: u.sector ?? undefined,
    avatarColor: u.avatarColor,
    lastSeen: u.lastSeen.toISOString(),
  }
}

const AVATAR_COLORS = [
  VL_COLORS.accent,
  VL_COLORS.accent2,
  VL_COLORS.green,
  VL_COLORS.amber,
  VL_COLORS.red,
]

// Demo team members (Santiago, Chile area)
const DEMO_USERS = [
  { name: "Claudio Pérez", email: "claudio.perez@voicelink.app", role: "supervisor", sector: "Centro", lat: -33.4489, lng: -70.6693 },
  { name: "Claudio Urbina", email: "claudio.urbina@vtr.net", role: "guardia", sector: "Providencia", lat: -33.4286, lng: -70.6097 },
  { name: "María Soto", email: "maria.soto@voicelink.app", role: "operador", sector: "Las Condes", lat: -33.4088, lng: -70.5764 },
  { name: "Javier Rojas", email: "javier.rojas@voicelink.app", role: "guardia", sector: "Maipú", lat: -33.5115, lng: -70.7625 },
  { name: "Daniela Muñoz", email: "daniela.munoz@voicelink.app", role: "supervisor", sector: "Ñuñoa", lat: -33.4543, lng: -70.6012 },
  { name: "Pedro Fuentes", email: "pedro.fuentes@voicelink.app", role: "operador", sector: "Estación Central", lat: -33.4629, lng: -70.7038 },
]

export async function seedDatabase() {
  // Channels
  const existingChannels = await db.channel.count()
  if (existingChannels === 0) {
    await db.channel.createMany({
      data: CHANNEL_SEEDS.map((c) => ({
        id: c.id,
        name: c.name,
        label: c.label,
        description: c.description,
        icon: c.icon,
        members: JSON.stringify([]),
        hasPassword: false,
        isActive: true,
      })),
    })
  }

  // Demo users (with a known demo login)
  const existingUsers = await db.user.count()
  if (existingUsers === 0) {
    // Primary demo login — Administrador
    await db.user.create({
      data: {
        name: "Admin VoiceLink",
        email: "demo@voicelink.app",
        password: hashPassword("voicelink"),
        role: "administrador",
        plan: "empresarial",
        status: "online",
        battery: 92,
        lat: -33.45,
        lng: -70.66,
        sector: "HQ",
        avatarColor: VL_COLORS.accent2,
      },
    })
    // Demo team
    for (let i = 0; i < DEMO_USERS.length; i++) {
      const d = DEMO_USERS[i]
      await db.user.create({
        data: {
          name: d.name,
          email: d.email,
          password: hashPassword("voicelink"),
          role: d.role,
          plan: i % 2 === 0 ? "profesional" : "basico",
          status: i % 3 === 0 ? "offline" : i % 3 === 1 ? "busy" : "online",
          battery: [100, 78, 65, 55, 43, 87][i],
          lat: d.lat,
          lng: d.lng,
          sector: d.sector,
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        },
      })
    }
  }
}

export async function ensureSeeded() {
  try {
    await seedDatabase()
  } catch (e) {
    console.error("[VoiceLink] seed error:", e)
  }
}

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.id === role)?.name ?? role
}

export function channelsToV(c: {
  id: string
  name: string
  label: string
  description: string
  icon: string
  members: string
  hasPassword: boolean
  isActive: boolean
}): VChannel {
  const seed = CHANNEL_SEEDS.find((s) => s.id === c.id)
  return {
    id: c.id,
    name: c.name,
    label: c.label,
    description: c.description,
    icon: (c.icon as VChannel["icon"]) || "radio",
    color: seed?.color ?? VL_COLORS.accent,
    members: safeParse(c.members, []),
    hasPassword: c.hasPassword,
    isActive: c.isActive,
  }
}

export function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}
