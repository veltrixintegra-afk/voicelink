import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureSeeded, hashPassword, makeToken, toVUser } from "@/lib/auth"
import type { VUser } from "@/lib/types"

export async function POST(req: Request) {
  await ensureSeeded()
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")

  if (!email || !password) {
    return NextResponse.json(
      { error: "Ingresa email y contraseña" },
      { status: 400 },
    )
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json(
      { error: "Cuenta no encontrada. Crea una cuenta nueva." },
      { status: 404 },
    )
  }

  const hashed = hashPassword(password)
  if (user.password !== hashed) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    )
  }

  await db.user.update({
    where: { id: user.id },
    data: { status: "online", lastSeen: new Date() },
  })

  const token = makeToken(user.id)
  const vuser: VUser = toVUser({ ...user, status: "online", lastSeen: new Date() })
  return NextResponse.json({ user: vuser, token })
}
