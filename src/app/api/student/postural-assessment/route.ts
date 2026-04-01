import { NextResponse } from "next/server"
import { requireStudent } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { student } = await requireStudent()
    const assessments = await prisma.posturalAssessment.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        overallScore: true,
        severeCount: true,
        moderateCount: true,
        mildCount: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ assessments })
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const { student } = await requireStudent()
    const hasPosture = await checkFeature(student.id, "hasPostureCamera")
    if (!hasPosture) {
      return NextResponse.json({ error: "Plano Elite necessário" }, { status: 403 })
    }

    const body = await req.json()
    const {
      frontalAngles,
      lateralAngles,
      findings,
      overallScore,
      severeCount,
      moderateCount,
      mildCount,
      correctiveExerciseIds,
    } = body

    if (!frontalAngles || !findings || overallScore == null) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const assessment = await prisma.posturalAssessment.create({
      data: {
        studentId: student.id,
        frontalAngles,
        lateralAngles: lateralAngles ?? undefined,
        findings,
        overallScore,
        severeCount: severeCount ?? 0,
        moderateCount: moderateCount ?? 0,
        mildCount: mildCount ?? 0,
        correctiveExerciseIds: correctiveExerciseIds ?? [],
      },
    })

    return NextResponse.json({ assessment }, { status: 201 })
  } catch (err) {
    console.error("[PosturalAssessment] POST error:", err)
    return NextResponse.json({ error: "Erro ao salvar avaliação" }, { status: 500 })
  }
}
