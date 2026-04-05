import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

// ══════════════════════════════════════════════════════════════════════════════
// FitVS Signaling API — Simple relay for WebRTC offers/answers
//
// In-memory store (no DB needed for MVP). Rooms expire after 5 minutes.
// POST: Create/update room signal
// GET:  Poll for signal updates
// ══════════════════════════════════════════════════════════════════════════════

interface RoomSignal {
  offer?: string
  answer?: string
  hostReady?: boolean
  guestReady?: boolean
  exerciseId?: string
  exerciseName?: string
  targetReps?: number
  createdAt: number
}

// In-memory store — MVP LIMITATION: on Vercel serverless, each cold start
// gets a fresh Map. For local dev and single-instance deploys (Coolify) this
// works fine. For Vercel production, migrate to Vercel KV or database.
// TODO: Replace with `await kv.set/get` when Vercel KV is configured.
const rooms = new Map<string, RoomSignal>()

// Clean expired rooms (>5 min)
function cleanExpired() {
  const now = Date.now()
  for (const [id, room] of rooms) {
    if (now - room.createdAt > 5 * 60 * 1000) {
      rooms.delete(id)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    cleanExpired()
    const body = await req.json()
    const { roomId, action, data } = body as {
      roomId: string
      action: "create" | "offer" | "answer" | "ready" | "config"
      data?: string
    }

    if (!roomId || !action) {
      return NextResponse.json({ error: "Missing roomId or action" }, { status: 400 })
    }

    if (action === "create") {
      rooms.set(roomId, { createdAt: Date.now() })
      return NextResponse.json({ ok: true, roomId })
    }

    const room = rooms.get(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (action === "offer" && data) {
      room.offer = data
    } else if (action === "answer" && data) {
      room.answer = data
    } else if (action === "ready") {
      if (data === "host") room.hostReady = true
      else room.guestReady = true
    } else if (action === "config" && data) {
      const config = JSON.parse(data)
      room.exerciseId = config.exerciseId
      room.exerciseName = config.exerciseName
      room.targetReps = config.targetReps
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    cleanExpired()
    const searchParams = req.nextUrl.searchParams
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 })
    }

    const room = rooms.get(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found", exists: false }, { status: 404 })
    }

    return NextResponse.json({
      exists: true,
      hasOffer: !!room.offer,
      hasAnswer: !!room.answer,
      offer: room.offer,
      answer: room.answer,
      hostReady: room.hostReady ?? false,
      guestReady: room.guestReady ?? false,
      exerciseId: room.exerciseId,
      exerciseName: room.exerciseName,
      targetReps: room.targetReps ?? 5,
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
