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

const JWT_SECRET = getJwtSecret()
const JWT_EXPIRES_IN = "7d"

export interface TokenPayload {
  userId: string
  email: string
  role: "ADMIN" | "STUDENT"
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
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

export async function requireAuth(): Promise<TokenPayload> {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function requireAdmin(): Promise<TokenPayload> {
  const session = await requireAuth()
  if (session.role !== "ADMIN") throw new Error("Forbidden")
  return session
}
