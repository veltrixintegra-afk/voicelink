import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureSeeded, hashPassword, makeToken, toVUser } from "@/lib/auth"
import type { PlanId, VUser } from "@/lib/types"
import { VL_COLORS, ADMIN_EMAIL } from "@/lib/constants"

export async function POST(req: Request) {
  await ensureSeeded()
  const body = await req.json().catch(() => ({}))
  const name = String(body.name || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const requestedPlan = (String(body.plan || "basico") as PlanId) || "basico"

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Completa nombre, email y contraseña" },
      { status: 400 },
    )
  }
  if (password.length < 4) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 4 caracteres" },
      { status: 400 },
    )
  }

  // The authorized administrator email is always promoted to admin + empresarial.
  const isAdminEmail = email === ADMIN_EMAIL
  const role = isAdminEmail ? "administrador" : "operador"
  const plan: PlanId = isAdminEmail ? "empresarial" : requestedPlan

  if (plan === "empresarial" && !isAdminEmail) {
    return NextResponse.json(
      {
        error:
          "El plan Empresarial solo está disponible para administradores autorizados",
      },
      { status: 403 },
    )
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    // If the account already exists (e.g. seeded admin), update the password
    // to the one provided now (so the owner can set their own) and log in.
    const token = makeToken(existing.id)
    await db.user.update({
      where: { id: existing.id },
      data: {
        password: hashPassword(password),
        status: "online",
        lastSeen: new Date(),
        // Re-promote admin email just in case
        ...(isAdminEmail ? { role: "administrador", plan: "empresarial" } : {}),
      },
    })
    const vuser: VUser = toVUser({
      ...existing,
      password: hashPassword(password),
      status: "online",
      lastSeen: new Date(),
      ...(isAdminEmail ? { role: "administrador", plan: "empresarial" } : {}),
    })
    return NextResponse.json({ user: vuser, token })
  }

  const colors = [VL_COLORS.accent, VL_COLORS.accent2, VL_COLORS.green, VL_COLORS.amber]
  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashPassword(password),
      role,
      plan,
      status: "online",
      battery: 100,
      lat: -33.45,
      lng: -70.66,
      sector: "Centro",
      avatarColor: isAdminEmail ? VL_COLORS.accent2 : colors[Math.floor(Math.random() * colors.length)],
    },
  })

  const token = makeToken(user.id)
  const vuser: VUser = toVUser(user)
  return NextResponse.json({ user: vuser, token })
}
