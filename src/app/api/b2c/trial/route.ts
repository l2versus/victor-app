import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { addDays } from "date-fns"

// POST /api/b2c/trial — Start free 3-day trial (B2C self-service)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha sao obrigatorios" },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no minimo 6 caracteres" },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ja esta cadastrado. Faca login ou use outro email." },
        { status: 409 },
      )
    }

    // Find the free trial B2C plan
    const freePlan = await prisma.plan.findUnique({
      where: { slug: "b2c-free-trial" },
    })
    if (!freePlan) {
      return NextResponse.json(
        { error: "Plano trial nao encontrado. Contate o suporte." },
        { status: 500 },
      )
    }

    // Hash password
    const hashedPwd = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPwd,
        role: "STUDENT",
      },
    })

    const now = new Date()
    const trialEnd = addDays(now, 3)

    // Create student profile + subscription in transaction
    await prisma.$transaction(async (tx) => {
      // Create student (B2C: no trainer, no org)
      const student = await tx.student.create({
        data: {
          userId: user.id,
          trainerId: null,
          organizationId: null,
          status: "ACTIVE",
          goals: "Trial gratuito B2C",
        },
      })

      // Create trial subscription
      await tx.subscription.create({
        data: {
          studentId: student.id,
          planId: freePlan.id,
          status: "TRIAL",
          startDate: now,
          endDate: trialEnd,
          trialEndsAt: trialEnd,
          autoRenew: false,
        },
      })

      // Welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "trial_started",
          title: "Bem-vindo ao Victor App!",
          body: "Seu trial gratuito de 3 dias comecou. Explore todos os recursos!",
        },
      })
    })

    // Generate JWT and set cookie for auto-login
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: "STUDENT",
      sv: user.sessionVersion,
    })

    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      redirect: "/student/dashboard",
      trialEndsAt: trialEnd.toISOString(),
    })
  } catch (error) {
    console.error("[B2C Trial] Error:", error)

    // Handle unique constraint (race condition)
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Este email ja esta cadastrado." },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { error: "Erro ao criar conta trial" },
      { status: 500 },
    )
  }
}
