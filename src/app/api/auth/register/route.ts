import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha sao obrigatorios" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email ja cadastrado" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role === "ADMIN" ? "ADMIN" : "STUDENT",
      },
    })

    // If admin, create trainer profile
    if (user.role === "ADMIN") {
      await prisma.trainerProfile.create({
        data: { userId: user.id },
      })
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
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
