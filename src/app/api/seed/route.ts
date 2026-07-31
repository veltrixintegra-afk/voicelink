import { NextResponse } from "next/server"
import { ensureSeeded } from "@/lib/auth"

// Ensures the DB has demo channels, users and a demo login.
export async function POST() {
  await ensureSeeded()
  return NextResponse.json({ ok: true, message: "VoiceLink demo data seeded" })
}

export async function GET() {
  await ensureSeeded()
  return NextResponse.json({ ok: true })
}
