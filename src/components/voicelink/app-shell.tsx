"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { ChannelsView } from "./views/channels-view"
import { MapView } from "./views/map-view"
import { HistoryView } from "./views/history-view"
import { IntegrationsView } from "./views/integrations-view"
import { AdminView } from "./views/admin-view"
import { PlansView } from "./views/plans-view"
import { ProfileView } from "./views/profile-view"
import { useVL } from "@/store/use-voicelink"
import { apiFetch } from "@/lib/api"
import type { VChannel, VMessage, VUser } from "@/lib/types"
import { toast } from "sonner"

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeView = useVL((s) => s.activeView)
  const activeChannelId = useVL((s) => s.activeChannelId)
  const setChannels = useVL((s) => s.setChannels)
  const setMessages = useVL((s) => s.setMessages)
  const setUsers = useVL((s) => s.setUsers)
  const user = useVL((s) => s.user)
  const setUser = useVL((s) => s.setUser)
  const token = useVL((s) => s.token)
  const presenceTick = useRef(0)

  // Initial load: channels, users, messages
  const loadAll = useCallback(async () => {
    try {
      const [chRes, usRes] = await Promise.all([
        apiFetch<{ channels: VChannel[] }>("/api/channels"),
        apiFetch<{ users: VUser[]; me: VUser | null }>("/api/users", {}),
      ])
      setChannels(chRes.channels)
      setUsers(usRes.users)
      if (usRes.me) setUser(usRes.me)
    } catch (e) {
      console.error("[VoiceLink] load error:", e)
    }
  }, [setChannels, setUsers, setUser])

  const loadMessages = useCallback(
    async (channelId: string) => {
      try {
        const res = await apiFetch<{ messages: VMessage[] }>(
          `/api/messages?channelId=${encodeURIComponent(channelId)}`,
        )
        setMessages(res.messages)
      } catch (e) {
        console.error("[VoiceLink] messages error:", e)
      }
    },
    [setMessages],
  )

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    void loadMessages(activeChannelId)
  }, [activeChannelId, loadMessages])

  // Presence + location reporting (best-effort, every 25s)
  useEffect(() => {
    if (!token || !user) return
    let active = true

    const report = async () => {
      presenceTick.current += 1
      // Refresh user list periodically so map stays fresh
      try {
        const usRes = await apiFetch<{ users: VUser[]; me: VUser | null }>(
          "/api/users",
          {},
        )
        if (active) {
          setUsers(usRes.users)
          if (usRes.me) setUser(usRes.me)
        }
      } catch {
        /* ignore */
      }
    }

    // Attempt to attach real geolocation to the current user
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await apiFetch<{ user: VUser }>("/api/users", {
              method: "PUT",
              json: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            })
            if (active) setUser(res.user)
          } catch {
            /* ignore */
          }
        },
        (err) => {
          console.warn("[VoiceLink] Geolocation:", err.message)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      )
    }

    const id = setInterval(report, 25000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [token, user?.id, setUser, setUsers])

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--vl-bg)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0">
          {activeView === "channels" && <ChannelsView />}
          {activeView === "map" && <MapView />}
          {activeView === "history" && <HistoryView />}
          {activeView === "integrations" && <IntegrationsView />}
          {activeView === "admin" && <AdminView />}
          {activeView === "plans" && <PlansView />}
          {activeView === "profile" && <ProfileView />}
        </main>
      </div>
    </div>
  )
}

export function useToastSafe() {
  return toast
}
