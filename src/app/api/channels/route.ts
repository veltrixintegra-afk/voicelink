import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { channelsToV, ensureSeeded } from "@/lib/auth"
import { CHANNEL_SEEDS, VL_COLORS } from "@/lib/constants"
import type { ChannelIcon } from "@/lib/constants"

export async function GET() {
  await ensureSeeded()
  const channels = await db.channel.findMany({ orderBy: { createdAt: "asc" } })
  return NextResponse.json({ channels: channels.map(channelsToV) })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const name = String(body.name || "").trim()
  const description = String(body.description || "").trim()
  const icon = (String(body.icon || "radio") as ChannelIcon) || "radio"
  const hasPassword = Boolean(body.hasPassword)
  const password = body.password ? String(body.password) : null

  if (!name) {
    return NextResponse.json({ error: "Nombre del canal requerente" }, { status: 400 })
  }

  const id = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const existing = await db.channel.findUnique({ where: { id } })
  if (existing) {
    return NextResponse.json({ error: "Ya existe un canal con ese nombre" }, { status: 409 })
  }

  const created = await db.channel.create({
    data: {
      id,
      name,
      label: id,
      description: description || `Canal ${name}`,
      icon,
      members: JSON.stringify([]),
      hasPassword,
      password,
      isActive: true,
    },
  })
  return NextResponse.json({ channel: channelsToV(created) })
}

// PUT — rename a channel and/or assign members.
// Body: { id, name?, description?, icon?, members?: string[] }
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || "")
  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 })
  }

  const existing = await db.channel.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  if (typeof body.name === "string" && body.name.trim()) {
    const name = body.name.trim()
    // Don't allow duplicate names (different id, same slug)
    data.name = name
    data.label = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || id
  }

  if (typeof body.description === "string") {
    data.description = body.description.trim() || existing.description
  }

  if (typeof body.icon === "string") {
    data.icon = body.icon
  }

  if (Array.isArray(body.members)) {
    // Validate member ids exist
    const memberIds = body.members.map(String)
    const valid = await db.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    })
    data.members = JSON.stringify(valid.map((u) => u.id))
  }

  const updated = await db.channel.update({ where: { id }, data })
  return NextResponse.json({ channel: channelsToV(updated) })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id || id === "general") {
    return NextResponse.json({ error: "No se puede eliminar este canal" }, { status: 400 })
  }
  try {
    await db.channel.delete({ where: { id } })
    await db.message.deleteMany({ where: { channelId: id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 })
  }
}

// Re-export seeds for potential reuse
export { CHANNEL_SEEDS, VL_COLORS }
