import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"

// Rate limit: max 5 failed attempts per email per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now()
  const key = email.toLowerCase()
  const entry = loginAttempts.get(key)

  if (!entry || now > entry.resetAt) {
    return { allowed: true }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfterSec }
  }

  return { allowed: true }
}

function recordFailedAttempt(email: string) {
  const now = Date.now()
  const key = email.toLowerCase()
  const entry = loginAttempts.get(key)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count++
  }
}

function clearAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase())
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatorios" }, { status: 400 })
    }

    // Check rate limit
    const { allowed, retryAfterSec } = checkLoginRateLimit(email)
    if (!allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${retryAfterSec} segundos.` },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.active) {
      recordFailedAttempt(email)
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      recordFailedAttempt(email)
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 })
    }

    // Login successful — clear attempts
    clearAttempts(email)

    // Increment sessionVersion — invalidates any previous session on other devices
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sv: updated.sessionVersion,
    })

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
