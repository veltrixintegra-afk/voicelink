import { NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import { INTENT_PATTERNS, INTEGRATION_META } from "@/lib/constants"
import type { IntentResponse, VMessageAction } from "@/lib/types"

// Detects intent in a transcribed message using the LLM skill and suggests
// automated actions (alerts, integrations, location share, reports).
// Falls back to a fast regex-based detector if the LLM is unavailable.
// Body: { transcript: string }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const transcript = String(body.transcript || "").trim()

  if (!transcript) {
    return NextResponse.json(
      { error: "Transcripción vacía" },
      { status: 400 },
    )
  }

  // Fast local detector (always runs — gives a reliable baseline)
  const localActions: VMessageAction[] = []
  let localIntent = "mensaje"
  for (const p of INTENT_PATTERNS) {
    if (p.pattern.test(transcript)) {
      localIntent = p.type
      localActions.push({
        type: p.type,
        label: p.label,
        integration: p.integration,
      })
      break
    }
  }

  try {
    const zai = await ZAI.create()
    const system = `Eres el motor de detección de intención de VoiceLink, un sistema PTT (push-to-talk) de seguridad y operaciones en Chile.
Analiza la transcripción de un mensaje de voz en español (Chile) y responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, con esta forma exacta:
{
  "intent": "<uno de: alerta | coordinacion | reporte | solicitud_ubicacion | integracion_whatsapp | integracion_email | integracion_telegram | integracion_slack | normal>",
  "summary": "<resumen breve en español, máximo 12 palabras, del mensaje>",
  "actions": [
    { "type": "<identificador corto>", "label": "<etiqueta en español para el botón de acción>", "integration": "<uno de: whatsapp | email | telegram | slack | webhook, o omítelo si no aplica>" }
  ]
}
Reglas:
- Si el mensaje menciona emergencia, peligro, ayuda, robo, incendio o intruso, intent = "alerta" y agrega una acción { "type": "alert", "label": "Disparar alerta de emergencia" }.
- Si menciona WhatsApp, agrega acción con integration "whatsapp".
- Si menciona correo/email, agrega acción con integration "email".
- Si menciona Telegram, agrega acción con integration "telegram".
- Si menciona Slack, agrega acción con integration "slack".
- Si menciona ubicación/posición/GPS/dónde estoy, agrega acción { "type": "share_location", "label": "Compartir ubicación GPS" }.
- Si menciona reporte o informe, agrega acción { "type": "report", "label": "Generar reporte" }.
- Si el mensaje es una comunicación normal sin acción especial, devuelve actions: [].`
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: transcript },
      ],
      thinking: { type: "disabled" },
    })

    const raw = completion?.choices?.[0]?.message?.content || ""
    const parsed = safeParseJSON(raw)
    if (parsed && typeof parsed === "object") {
      const actions: VMessageAction[] = Array.isArray(parsed.actions)
        ? parsed.actions
            .map((a: unknown) => normalizeAction(a))
            .filter(Boolean)
        : []
      // Merge with local detector so we never miss a critical alert
      const merged = mergeActions(localActions, actions)
      const out: IntentResponse = {
        intent: String(parsed.intent || localIntent),
        actions: merged,
        summary: String(parsed.summary || transcript.slice(0, 60)),
      }
      return NextResponse.json(out)
    }
    throw new Error("LLM response not JSON")
  } catch (err) {
    console.error("[VoiceLink] intent LLM error:", err)
    const out: IntentResponse = {
      intent: localIntent,
      actions: localActions,
      summary: transcript.slice(0, 60),
    }
    return NextResponse.json(out)
  }
}

function safeParseJSON(s: string): unknown {
  // Strip code fences if present
  const cleaned = s
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  const candidate = match ? match[0] : cleaned
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function normalizeAction(a: unknown): VMessageAction | null {
  if (!a || typeof a !== "object") return null
  const obj = a as Record<string, unknown>
  const type = String(obj.type || "")
  const label = String(obj.label || "")
  if (!type || !label) return null
  const integrationRaw = String(obj.integration || "")
  const integration =
    integrationRaw && INTEGRATION_META[integrationRaw as keyof typeof INTEGRATION_META]
      ? (integrationRaw as VMessageAction["integration"])
      : undefined
  return { type, label, integration }
}

function mergeActions(
  local: VMessageAction[],
  llm: VMessageAction[],
): VMessageAction[] {
  const seen = new Set<string>()
  const out: VMessageAction[] = []
  for (const a of [...local, ...llm]) {
    const key = a.integration ? `int:${a.integration}` : `act:${a.type}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}
