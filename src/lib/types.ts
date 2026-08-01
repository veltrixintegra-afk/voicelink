// VoiceLink — shared types

import type { ChannelIcon, IntegrationId, PlanId } from "./constants"

export type ViewId =
  | "channels"
  | "map"
  | "history"
  | "integrations"
  | "admin"
  | "plans"
  | "profile"

export interface VUser {
  id: string
  name: string
  email: string
  role: "operador" | "supervisor" | "administrador" | "guardia"
  plan: PlanId
  status: "online" | "offline" | "busy"
  battery: number
  lat?: number
  lng?: number
  sector?: string
  avatarColor: string
  lastSeen: string
}

export interface VChannel {
  id: string
  name: string
  label: string
  description: string
  icon: ChannelIcon
  color: string
  members: string[]
  hasPassword: boolean
  isActive: boolean
  unread?: number
}

export type MessageType = "voice" | "text" | "alert"

export interface VMessageAction {
  type: string
  label: string
  integration?: IntegrationId
  executed?: boolean
}

export interface VMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  userRole: string
  type: MessageType
  audioBase64?: string
  transcript: string
  intent?: string
  actions?: VMessageAction[]
  lat?: number
  lng?: number
  duration: number
  createdAt: string
}

export interface TranscribeResponse {
  text: string
  duration: number
  cached?: boolean
}

export interface IntentResponse {
  intent: string
  actions: VMessageAction[]
  summary: string
}

export interface AuthResponse {
  user: VUser
  token: string
}

export interface StatsResponse {
  messagesToday: number
  actionsToday: number
  activeChannels: number
  onlineUsers: number
  whisperAccuracy: number
  whisperLatency: number
  cpuLoad: number
  chart: { t: string; mensajes: number; acciones: number }[]
}
