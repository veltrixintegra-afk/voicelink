"use client"

import { useEffect, useState } from "react"
import { AuthScreen } from "@/components/voicelink/auth-screen"
import { AppShell } from "@/components/voicelink/app-shell"
import { useVL } from "@/store/use-voicelink"
import { Logo } from "@/components/voicelink/logo"
import { VL_COLORS } from "@/lib/constants"
import { validateSession } from "@/lib/api"

export default function Home() {
  const isLoggedIn = useVL((s) => s.isLoggedIn)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let active = true
    async function boot() {
      try {
        // 1) Seed the demo database on first load
        await fetch("/api/seed", { method: "POST" })
      } catch (e) {
        console.warn("[VoiceLink] seed failed:", e)
      }
      // 2) If the user thinks they're logged in, verify the token is still
      //    valid. A stale/invalid token is cleared so the login screen shows.
      if (useVL.getState().isLoggedIn) {
        await validateSession()
      }
      if (active) setBooting(false)
    }
    boot()
    return () => {
      active = false
    }
  }, [])

  if (booting) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: VL_COLORS.bg }}
      >
        <Logo size={56} />
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full vl-live-dot"
            style={{ background: VL_COLORS.accent }}
          />
          <span className="text-xs" style={{ color: VL_COLORS.text2 }}>
            Iniciando VoiceLink…
          </span>
        </div>
      </div>
    )
  }

  return isLoggedIn ? <AppShell /> : <AuthScreen />
}
