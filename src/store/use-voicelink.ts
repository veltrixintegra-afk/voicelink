"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { VChannel, VMessage, VUser, ViewId } from "@/lib/types"

interface VLState {
  // auth
  user: VUser | null
  token: string | null
  isLoggedIn: boolean
  // navigation
  activeView: ViewId
  activeChannelId: string
  isDesktopMode: boolean
  // data
  channels: VChannel[]
  messages: VMessage[]
  users: VUser[]
  // ptt
  isTransmitting: boolean
  liveTranscript: string
  // actions
  setUser: (u: VUser | null) => void
  login: (u: VUser, token: string) => void
  logout: () => void
  setView: (v: ViewId) => void
  setActiveChannel: (id: string) => void
  setChannels: (c: VChannel[]) => void
  addChannel: (c: VChannel) => void
  removeChannel: (id: string) => void
  setMessages: (m: VMessage[]) => void
  addMessage: (m: VMessage) => void
  setUsers: (u: VUser[]) => void
  setTransmitting: (v: boolean) => void
  setLiveTranscript: (t: string) => void
  setDesktopMode: (v: boolean) => void
}

export const useVL = create<VLState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      activeView: "channels",
      activeChannelId: "general",
      isDesktopMode: false,
      channels: [],
      messages: [],
      users: [],
      isTransmitting: false,
      liveTranscript: "",

      setUser: (u) => set({ user: u }),
      login: (u, token) =>
        set({
          user: u,
          token,
          isLoggedIn: true,
          activeView: "channels",
          activeChannelId: "general",
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          activeView: "channels",
          channels: [],
          messages: [],
          users: [],
        }),
      setView: (v) => set({ activeView: v }),
      setActiveChannel: (id) => set({ activeChannelId: id }),
      setChannels: (c) => set({ channels: c }),
      addChannel: (c) => set((s) => ({ channels: [...s.channels, c] })),
      removeChannel: (id) =>
        set((s) => ({
          channels: s.channels.filter((c) => c.id !== id),
          activeChannelId:
            s.activeChannelId === id ? "general" : s.activeChannelId,
        })),
      setMessages: (m) => set({ messages: m }),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      setUsers: (u) => set({ users: u }),
      setTransmitting: (v) => set({ isTransmitting: v }),
      setLiveTranscript: (t) => set({ liveTranscript: t }),
      setDesktopMode: (v) => set({ isDesktopMode: v }),
    }),
    {
      name: "voicelink-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isLoggedIn: s.isLoggedIn,
        activeView: s.activeView,
        activeChannelId: s.activeChannelId,
        isDesktopMode: s.isDesktopMode,
      }),
    },
  ),
)
