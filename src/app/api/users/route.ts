import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureSeeded, getUserFromAuth, toVUser } from "@/lib/auth"
import type { VUser } from "@/lib/types"

// GET team members (all users) + optionally the current user.
export async function GET(req: Request) {
  await ensureSeeded()
  const auth = req.headers.get("authorization")
  const me = await getUserFromAuth(auth)

  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    take: 200,
  })

  const vusers: VUser[] = users.map(toVUser)
  return NextResponse.json({ users: vusers, me: me as VUser | null })
}

// PUT to update own location / presence
export async function PUT(req: Request) {
  const auth = req.headers.get("authorization")
  const me = await getUserFromAuth(auth)
  if (!me) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = { status: "online", lastSeen: new Date() }
  if (typeof body.lat === "number" && typeof body.lng === "number") {
    data.lat = body.lat
    data.lng = body.lng
  }
  if (typeof body.battery === "number") data.battery = Math.round(body.battery)
  if (typeof body.status === "string") data.status = body.status
  if (typeof body.sector === "string") data.sector = body.sector

  const updated = await db.user.update({ where: { id: me.id }, data })
  return NextResponse.json({ user: toVUser(updated) })
}
