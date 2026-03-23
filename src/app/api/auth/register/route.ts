import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha sao obrigatorios" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 })
    }

    // Find the trainer to auto-link the student
    const trainer = await prisma.trainerProfile.findFirst({
      select: { id: true },
    })

    if (!trainer) {
      return NextResponse.json({ error: "Nenhum personal cadastrado ainda" }, { status: 500 })
    }

    const hashedPassword = await hashPassword(password)

    // Create User + Student in a single transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "STUDENT",
        student: {
          create: {
            trainerId: trainer.id,
            status: "ACTIVE",
          },
        },
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sv: user.sessionVersion,
    })

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
