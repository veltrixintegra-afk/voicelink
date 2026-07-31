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
