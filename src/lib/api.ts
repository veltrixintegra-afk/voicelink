"use client"

import { useVL } from "@/store/use-voicelink"

/**
 * Thin fetch wrapper that attaches the auth token + handles JSON.
 * On 401 (unauthorized) it automatically clears the session so the
 * user is sent back to the login screen instead of being stuck.
 */
export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = useVL.getState().token
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  }
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(path, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
  })
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    // Auto-logout on auth failures so the login screen reappears.
    if (res.status === 401) {
      useVL.getState().logout()
    }
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as Record<string, unknown>).error)
        : null) || `Error ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

/**
 * Validate that the current session token is still accepted by the backend.
 * Returns true if valid, false otherwise (and clears the session if invalid).
 */
export async function validateSession(): Promise<boolean> {
  const token = useVL.getState().token
  if (!token) return false
  try {
    const res = await fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      useVL.getState().logout()
      return false
    }
    return true
  } catch {
    useVL.getState().logout()
    return false
  }
}
