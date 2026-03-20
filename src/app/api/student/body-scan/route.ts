import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"

// GET /api/student/body-scan — list scan history
export async function GET() {
  try {
    const { student } = await requireStudent()

    const scans = await prisma.bodyScan.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({ scans })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/student/body-scan — save a new scan
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const hasAccess = await checkFeature(student.id, "hasPostureCamera")
    if (!hasAccess) {
      return NextResponse.json({ error: "Plano Elite necessário" }, { status: 403 })
    }

    const body = await req.json()
    const { measurements, ratios, bodyShape, aiAnalysis, notes } = body

    if (!measurements || !ratios) {
      return NextResponse.json({ error: "Medidas e ratios são obrigatórios" }, { status: 400 })
    }

    const scan = await prisma.bodyScan.create({
      data: {
        studentId: student.id,
        measurements,
        ratios,
        bodyShape: bodyShape ?? null,
        aiAnalysis: aiAnalysis ?? null,
        notes: notes ?? null,
      },
    })

    return NextResponse.json({ scan }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
