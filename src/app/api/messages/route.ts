import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureSeeded, getUserFromAuth, safeParse, toVUser } from "@/lib/auth"
import type { VMessage, VMessageAction, VUser } from "@/lib/types"

// GET messages for a channel: /api/messages?channelId=general
export async function GET(req: Request) {
  await ensureSeeded()
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get("channelId") || "general"
  const q = searchParams.get("q") || ""

  const where: Record<string, unknown> = { channelId }
  const messages = await db.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 200,
  })

  let mapped: VMessage[] = messages.map((m) => ({
    id: m.id,
    channelId: m.channelId,
    userId: m.userId,
    userName: m.userName,
    userRole: m.userRole,
    type: m.type as VMessage["type"],
    audioBase64: m.audioBase64 ?? undefined,
    transcript: m.transcript,
    intent: m.intent ?? undefined,
    actions: safeParse<VMessageAction[]>(m.actions, []),
    lat: m.lat ?? undefined,
    lng: m.lng ?? undefined,
    duration: m.duration,
    createdAt: m.createdAt.toISOString(),
  }))

  if (q) {
    const needle = q.toLowerCase()
    mapped = mapped.filter((m) => m.transcript.toLowerCase().includes(needle))
  }

  return NextResponse.json({ messages: mapped })
}

// POST a new message (voice or text). Creates + optionally runs intent.
export async function POST(req: Request) {
  await ensureSeeded()
  const auth = req.headers.get("authorization")
  const user = await getUserFromAuth(auth)
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const channelId = String(body.channelId || "general")
  const type = (String(body.type || "voice") as VMessage["type"]) || "voice"
  const transcript = String(body.transcript || "")
  const audioBase64 = body.audioBase64 ? String(body.audioBase64) : null
  const lat = typeof body.lat === "number" ? body.lat : null
  const lng = typeof body.lng === "number" ? body.lng : null
  const duration = Number(body.duration || 0)
  const intent = body.intent ? String(body.intent) : null
  const actions = body.actions
    ? JSON.stringify(body.actions)
    : null

  // Refresh user presence
  await db.user.update({
    where: { id: user.id },
    data: { status: "online", lastSeen: new Date() },
  })

  const created = await db.message.create({
    data: {
      channelId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      type,
      audioBase64,
      transcript,
      intent,
      actions,
      lat,
      lng,
      duration,
    },
  })

  const msg: VMessage = {
    id: created.id,
    channelId: created.channelId,
    userId: created.userId,
    userName: created.userName,
    userRole: created.userRole,
    type: created.type as VMessage["type"],
    audioBase64: created.audioBase64 ?? undefined,
    transcript: created.transcript,
    intent: created.intent ?? undefined,
    actions: safeParse<VMessageAction[]>(created.actions, []),
    lat: created.lat ?? undefined,
    lng: created.lng ?? undefined,
    duration: created.duration,
    createdAt: created.createdAt.toISOString(),
  }

  return NextResponse.json({ message: msg, user: user as VUser })
}

// PUT to update message actions (e.g. mark integration as executed)
export async function PUT(req: Request) {
  const auth = req.headers.get("authorization")
  const user = await getUserFromAuth(auth)
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || "")
  const actions: VMessageAction[] = Array.isArray(body.actions) ? body.actions : []
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const updated = await db.message.update({
    where: { id },
    data: { actions: JSON.stringify(actions) },
  })
  return NextResponse.json({
    message: {
      id: updated.id,
      actions,
    },
    user: user as VUser,
  })
}

// Silence unused import warning while keeping helper available
void toVUser
