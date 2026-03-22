import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTrainerProfile } from "@/lib/admin"

// GET /api/admin/assessments?studentId=xxx&type=SKINFOLD
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {
      student: { trainerId: trainer.id },
    }
    if (studentId) where.studentId = studentId
    if (type) where.type = type

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error("GET /api/admin/assessments error:", error)
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
  }
}

// POST /api/admin/assessments — create assessment (anamnese, skinfold, etc)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { studentId, type, title, data, notes } = body

    if (!studentId || !type || !data) {
      return NextResponse.json(
        { error: "studentId, type, and data are required" },
        { status: 400 }
      )
    }

    // Verify student belongs to this trainer
    const student = await prisma.student.findFirst({
      where: { id: studentId, trainerId: trainer.id },
      include: { user: { select: { name: true } } },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // For SKINFOLD type, calculate body fat percentage
    let enrichedData = data
    if (type === "SKINFOLD") {
      enrichedData = calculateSkinfold(data, student)
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        type,
        title: title || getDefaultTitle(type),
        data: enrichedData,
        notes: notes || null,
      },
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    return NextResponse.json({ assessment }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/assessments error:", error)
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 })
  }
}

// ─── Skinfold Calculation (Pollock 7-site protocol) ──────────────────────────

interface SkinfoldData {
  // 7 dobras (mm)
  triceps: number
  subscapular: number
  pectoral: number
  midaxillary: number
  suprailiac: number
  abdominal: number
  thigh: number
  // Optional 3-site protocol extras
  // Dados do aluno
  age?: number
  gender?: "MALE" | "FEMALE"
  weight?: number
}

interface StudentForCalc {
  birthDate: Date | null
  gender: string | null
  weight: number | null
}

function calculateSkinfold(data: SkinfoldData, student: StudentForCalc) {
  const { triceps, subscapular, pectoral, midaxillary, suprailiac, abdominal, thigh } = data

  const sum7 = (triceps || 0) + (subscapular || 0) + (pectoral || 0) +
    (midaxillary || 0) + (suprailiac || 0) + (abdominal || 0) + (thigh || 0)

  // Age from student or data
  const age = data.age || (student.birthDate
    ? Math.floor((Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 25)

  const gender = (data.gender || student.gender || "MALE") as "MALE" | "FEMALE"
  const weight = data.weight || student.weight || 70

  // Jackson & Pollock 7-site formula
  let bodyDensity: number
  if (gender === "MALE") {
    bodyDensity = 1.112 -
      0.00043499 * sum7 +
      0.00000055 * sum7 * sum7 -
      0.00028826 * age
  } else {
    bodyDensity = 1.097 -
      0.00046971 * sum7 +
      0.00000056 * sum7 * sum7 -
      0.00012828 * age
  }

  // Siri equation: %BF = (495 / density) - 450
  const bodyFatPercent = Math.max(0, Math.min(60, (495 / bodyDensity) - 450))
  const fatMass = (bodyFatPercent / 100) * weight
  const leanMass = weight - fatMass

  // Classification
  let classification: string
  if (gender === "MALE") {
    if (bodyFatPercent < 6) classification = "Essencial"
    else if (bodyFatPercent < 14) classification = "Atleta"
    else if (bodyFatPercent < 18) classification = "Fitness"
    else if (bodyFatPercent < 25) classification = "Aceitavel"
    else classification = "Acima do ideal"
  } else {
    if (bodyFatPercent < 14) classification = "Essencial"
    else if (bodyFatPercent < 21) classification = "Atleta"
    else if (bodyFatPercent < 25) classification = "Fitness"
    else if (bodyFatPercent < 32) classification = "Aceitavel"
    else classification = "Acima do ideal"
  }

  return {
    ...data,
    sum7,
    bodyDensity: parseFloat(bodyDensity.toFixed(6)),
    bodyFatPercent: parseFloat(bodyFatPercent.toFixed(1)),
    fatMassKg: parseFloat(fatMass.toFixed(1)),
    leanMassKg: parseFloat(leanMass.toFixed(1)),
    classification,
    protocol: "Jackson & Pollock 7-site",
    formula: "Siri",
    calculatedAt: new Date().toISOString(),
  }
}

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    ANAMNESE: "Anamnese",
    PAR_Q: "PAR-Q",
    PHYSICAL: "Avaliação Física",
    ONE_RM: "Teste 1RM",
    SKINFOLD: "Dobras Cutâneas (Pollock 7)",
    CUSTOM: "Avaliação Personalizada",
  }
  return titles[type] || "Avaliação"
}
