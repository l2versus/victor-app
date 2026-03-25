import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// GET /api/student/measurements — list all measurements for current student
export async function GET() {
  try {
    const { student } = await requireStudent()

    const measurements = await prisma.bodyMeasurement.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ measurements })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/student/measurements — create a new measurement entry
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const body = await req.json()

    const {
      weight, bodyFat, neck, chest, shoulders,
      leftBicep, rightBicep, waist, abdomen, hips,
      leftThigh, rightThigh, leftCalf, rightCalf, notes,
    } = body

    // At least one measurement required
    const hasValue = [weight, bodyFat, neck, chest, shoulders, leftBicep, rightBicep, waist, abdomen, hips, leftThigh, rightThigh, leftCalf, rightCalf].some(v => v !== null && v !== undefined && v !== "")
    if (!hasValue) {
      return NextResponse.json({ error: "Preencha pelo menos uma medida" }, { status: 400 })
    }

    const toFloat = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null
      const n = parseFloat(String(v).replace(",", "."))
      return isNaN(n) ? null : Math.round(n * 10) / 10
    }

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        studentId: student.id,
        weight: toFloat(weight),
        bodyFat: toFloat(bodyFat),
        neck: toFloat(neck),
        chest: toFloat(chest),
        shoulders: toFloat(shoulders),
        leftBicep: toFloat(leftBicep),
        rightBicep: toFloat(rightBicep),
        waist: toFloat(waist),
        abdomen: toFloat(abdomen),
        hips: toFloat(hips),
        leftThigh: toFloat(leftThigh),
        rightThigh: toFloat(rightThigh),
        leftCalf: toFloat(leftCalf),
        rightCalf: toFloat(rightCalf),
        notes: notes?.slice(0, 500) || null,
      },
    })

    return NextResponse.json({ measurement }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/student/measurements — delete a measurement
export async function DELETE(req: NextRequest) {
  try {
    const { student } = await requireStudent()
    const { id } = await req.json()

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const m = await prisma.bodyMeasurement.findUnique({ where: { id }, select: { studentId: true } })
    if (!m || m.studentId !== student.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.bodyMeasurement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
