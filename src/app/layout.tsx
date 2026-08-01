import type { Metadata, Viewport } from "next"
import { DM_Sans, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "VoiceLink — PTT Inteligente con IA",
  description:
    "VoiceLink: Push-to-Talk inteligente con transcripción IA en tiempo real, geolocalización e integraciones multi-app. Android, iOS y Web.",
  keywords: [
    "VoiceLink",
    "PTT",
    "Push-to-Talk",
    "IA",
    "Whisper",
    "transcripción",
    "walkie-talkie",
    "seguridad",
  ],
  authors: [{ name: "VoiceLink Team" }],
  icons: {
    icon: [
      { url: "/voicelink-icon.svg", type: "image/svg+xml" },
      { url: "/voicelink-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/voicelink-icon.png",
  },
  openGraph: {
    title: "VoiceLink — PTT Inteligente con IA",
    description:
      "Habla. Transcribe. Actúa. Comunicación PTT con IA, mapa en tiempo real e integraciones.",
    url: "https://voicelink.app",
    siteName: "VoiceLink",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "VoiceLink — PTT Inteligente con IA",
    description:
      "Habla. Transcribe. Actúa. Comunicación PTT con IA, mapa en tiempo real e integraciones.",
  },
}

export const viewport: Viewport = {
  themeColor: "#0e0f14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  )
}
