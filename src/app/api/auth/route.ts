import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  ensureSeeded,
  hashPassword,
  makeToken,
  toVUser,
} from "@/lib/auth"
import type { PlanId, VUser } from "@/lib/types"
import { VL_COLORS, ADMIN_EMAIL } from "@/lib/constants"

// Combined auth endpoint — handles both login and register in a single
// route file to reduce Turbopack compilations (memory-constrained env).
// Body: { action: "login" | "register", name?, email, password, plan? }
export async function POST(req: Request) {
  await ensureSeeded()
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || "login")
  const name = String(body.name || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")

  if (!email || !password) {
    return NextResponse.json(
      { error: "Ingresa email y contraseña" },
      { status: 400 },
    )
  }

  // ── LOGIN ──────────────────────────────────────────────
  if (action === "login") {
    if (password.length < 1) {
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
    if (user.password !== hashPassword(password)) {
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
    const vuser: VUser = toVUser({
      ...user,
      status: "online",
      lastSeen: new Date(),
    })
    return NextResponse.json({ user: vuser, token })
  }

  // ── REGISTER ───────────────────────────────────────────
  if (action === "register") {
    if (!name) {
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

    const isAdminEmail = email === ADMIN_EMAIL
    const requestedPlan = (String(body.plan || "basico") as PlanId) || "basico"
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
      // Account exists — verify password, don't overwrite.
      if (existing.password !== hashPassword(password)) {
        return NextResponse.json(
          {
            error:
              "Ya existe una cuenta con este email. Usa \"Ingresar\" con tu contraseña actual.",
          },
          { status: 409 },
        )
      }
      const token = makeToken(existing.id)
      await db.user.update({
        where: { id: existing.id },
        data: {
          status: "online",
          lastSeen: new Date(),
          ...(isAdminEmail
            ? { role: "administrador", plan: "empresarial" }
            : {}),
        },
      })
      const vuser: VUser = toVUser({
        ...existing,
        status: "online",
        lastSeen: new Date(),
        ...(isAdminEmail
          ? { role: "administrador", plan: "empresarial" }
          : {}),
      })
      return NextResponse.json({ user: vuser, token })
    }

    const colors = [
      VL_COLORS.accent,
      VL_COLORS.accent2,
      VL_COLORS.green,
      VL_COLORS.amber,
    ]
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
        avatarColor: isAdminEmail
          ? VL_COLORS.accent2
          : colors[Math.floor(Math.random() * colors.length)],
      },
    })
    const token = makeToken(user.id)
    const vuser: VUser = toVUser(user)
    return NextResponse.json({ user: vuser, token })
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
