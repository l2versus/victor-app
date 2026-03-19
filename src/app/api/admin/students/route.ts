import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// GET /api/admin/students — list students with search, status filter, pagination
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { trainerId: trainer.id }

    if (status && ["ACTIVE", "INACTIVE", "PENDING"].includes(status)) {
      where.status = status
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true, active: true, avatar: true } },
          sessions: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { startedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ])

    return NextResponse.json({
      students,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/admin/students — create student + user
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const body = await req.json()
    const {
      name,
      email,
      phone,
      password,
      birthDate,
      gender,
      weight,
      height,
      goals,
      restrictions,
      notes,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    // Generate random password if not provided
    const generatedPassword = password || crypto.randomBytes(4).toString("hex")
    const hashedPassword = await hashPassword(generatedPassword)

    // Create user + student in a transaction
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          password: hashedPassword,
          role: "STUDENT",
          active: true,
        },
      })

      const student = await tx.student.create({
        data: {
          userId: user.id,
          trainerId: trainer.id,
          birthDate: birthDate ? new Date(birthDate) : null,
          gender: gender || null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          goals: goals || null,
          restrictions: restrictions ? JSON.parse(JSON.stringify(restrictions)) : null,
          notes: notes || null,
          status: "ACTIVE",
        },
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      })

      return student
    })

    return NextResponse.json({
      student,
      generatedPassword: password ? undefined : generatedPassword,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
