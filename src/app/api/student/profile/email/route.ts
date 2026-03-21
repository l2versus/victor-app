import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, verifyPassword, generateToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { newEmail, password } = await req.json()

    if (!newEmail || !password) {
      return NextResponse.json({ error: "Novo email e senha são obrigatórios" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { password: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    if (user.email === newEmail) {
      return NextResponse.json({ error: "O novo email é igual ao atual" }, { status: 400 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    // Verificar se o email já está em uso
    const existing = await prisma.user.findUnique({ where: { email: newEmail } })
    if (existing) {
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 409 })
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { email: newEmail, sessionVersion: { increment: 1 } },
      select: { sessionVersion: true, role: true },
    })

    // Gerar novo token com email atualizado
    const token = generateToken({
      userId: session.userId,
      email: newEmail,
      role: updated.role,
      sv: updated.sessionVersion,
    })

    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return NextResponse.json({ message: "Email alterado com sucesso", email: newEmail })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
