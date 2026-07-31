"use client"

import { useVL } from "@/store/use-voicelink"

/** Thin fetch wrapper that attaches the auth token + handles JSON. */
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
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as Record<string, unknown>).error)
        : null) || `Error ${res.status}`
    throw new Error(msg)
  }
  return data as T
}
