import { NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import type { TranscribeResponse } from "@/lib/types"

// Transcribes an audio blob (base64) using the ASR skill (Whisper).
// Body: { audio: "<base64 data url or raw base64>" }
export async function POST(req: Request) {
  const start = Date.now()
  const body = await req.json().catch(() => ({}))
  const audio: string = String(body.audio || "")

  if (!audio) {
    return NextResponse.json(
      { error: "No se recibió audio" },
      { status: 400 },
    )
  }

  // Accept either a data URL ("data:audio/webm;base64,....") or raw base64.
  const base64 = audio.startsWith("data:")
    ? audio.split(",")[1] || ""
    : audio

  if (!base64) {
    return NextResponse.json({ error: "Audio vacío" }, { status: 400 })
  }

  try {
    const zai = await ZAI.create()
    const response = await zai.audio.asr.create({ file_base64: base64 })
    const text = (response?.text || "").trim()
    const duration = Date.now() - start

    const out: TranscribeResponse = {
      text,
      duration,
    }
    return NextResponse.json(out)
  } catch (err) {
    console.error("[VoiceLink] ASR error:", err)
    return NextResponse.json(
      {
        error:
          "No se pudo transcribir el audio en este momento. Intenta nuevamente.",
        text: "",
        duration: Date.now() - start,
      },
      { status: 500 },
    )
  }
}
