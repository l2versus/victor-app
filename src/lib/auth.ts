import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured")
  }
  return secret
}

const JWT_EXPIRES_IN = "7d"

export interface TokenPayload {
  userId: string
  email: string
  role: "ADMIN" | "STUDENT" | "NUTRITIONIST" | "MASTER"
  /** Session version — must match User.sessionVersion or session is invalid */
  sv?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) return null
  return verifyToken(token)
}

/**
 * Validate session against the database sessionVersion.
 * If another device logged in, the version won't match → session invalid.
 */
export async function validateSession(session: TokenPayload): Promise<boolean> {
  // Tokens without sv field are from before this feature — allow them
  if (session.sv === undefined) return true

  // Lazy import to avoid circular dependency
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { sessionVersion: true, active: true },
  })

  if (!user || !user.active) return false
  return user.sessionVersion === session.sv
}

export async function requireAuth(): Promise<TokenPayload> {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  // Check session version — if mismatched, another device logged in
  const valid = await validateSession(session)
  if (!valid) {
    // Clear the stale cookie
    const cookieStore = await cookies()
    cookieStore.delete("token")
    throw new Error("SessionExpired")
  }

  return session
}

export async function requireAdmin(): Promise<TokenPayload> {
  const session = await requireAuth()
  if (session.role !== "ADMIN") throw new Error("Forbidden")
  return session
}

export async function requireStudent(): Promise<TokenPayload> {
  const session = await requireAuth()
  if (session.role !== "STUDENT") throw new Error("Forbidden")
  return session
}

/** Require MASTER role (platform super-admin) */
export async function requireMaster() {
  const session = await requireAuth()
  if (session.role !== "MASTER") {
    throw new Error("Forbidden")
  }
  return session
}

/** Require NUTRITIONIST role */
export async function requireNutritionist() {
  const session = await requireAuth()
  if (session.role !== "NUTRITIONIST") {
    throw new Error("Forbidden")
  }
  return session
}

/** Require any of the specified roles */
export async function requireRole(...roles: TokenPayload["role"][]) {
  const session = await requireAuth()
  if (!roles.includes(session.role)) {
    throw new Error("Forbidden")
  }
  return session
}
