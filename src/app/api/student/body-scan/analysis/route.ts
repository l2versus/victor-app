import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { aiModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"

const SHAPE_LABELS: Record<string, string> = {
  V_SHAPE: "Triângulo Invertido (Shape V)",
  TRAPEZOID: "Trapezoide",
  X_SHAPE: "Ampulheta",
  RECTANGLE: "Retângulo",
  PEAR: "Pera",
}

const IDEAL_RATIOS = `
- Ombro/Quadril: 1.35–1.45 (atlético), > 1.45 (V-shape pronunciado)
- Ombro/Cintura: 1.45–1.65 (boa definição de cintura)
- Cintura/Quadril: < 0.85 (boa proporção), < 0.80 (excelente)
- Perna/Tronco: 1.0–1.3 (proporcional)`.trim()

export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent()

    const hasAccess = await checkFeature(student.id, "hasPostureCamera")
    if (!hasAccess) {
      return NextResponse.json({ error: "Plano Elite necessário" }, { status: 403 })
    }

    const body = await req.json()
    const { ratios, bodyShape, measurements } = body as {
      ratios: Record<string, number>
      bodyShape: string
      measurements: Record<string, number>
    }

    if (!ratios || !bodyShape) {
      return NextResponse.json({ error: "Dados de scan inválidos" }, { status: 400 })
    }

    // Load full student profile (goals + restrictions)
    const fullStudent = await prisma.student.findUnique({
      where: { id: student.id },
      select: {
        goals: true,
        restrictions: true,
        gender: true,
        user: { select: { name: true } },
        assessments: {
          where: { type: "ANAMNESE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { data: true },
        },
      },
    })

    const name = fullStudent?.user.name ?? "Aluno"
    const goals = fullStudent?.goals ?? "não definido"
    const restrictions = fullStudent?.restrictions
      ? JSON.stringify(fullStudent.restrictions)
      : "nenhuma restrição informada"
    const gender = fullStudent?.gender === "FEMALE" ? "feminino" : "masculino"

    // Pull extra anamnese data if available
    let anamneseExtra = ""
    const anamneseData = fullStudent?.assessments?.[0]?.data
    if (anamneseData && typeof anamneseData === "object") {
      const d = anamneseData as Record<string, unknown>
      const extras = [
        d.currentActivity ? `Nível de atividade: ${d.currentActivity}` : null,
        d.trainingTime ? `Tempo de treino: ${d.trainingTime}` : null,
        d.mainGoal ? `Meta principal: ${d.mainGoal}` : null,
        d.bodyFocusAreas ? `Áreas de foco: ${d.bodyFocusAreas}` : null,
      ].filter(Boolean)
      if (extras.length) anamneseExtra = "\nDados adicionais da anamnese:\n" + extras.join("\n")
    }

    const prompt = `ALUNO: ${name} (${gender})
OBJETIVO: ${goals}
RESTRIÇÕES DE SAÚDE: ${restrictions}${anamneseExtra}

RESULTADO DO SCAN CORPORAL (MediaPipe Pose):
Formato corporal detectado: ${SHAPE_LABELS[bodyShape] ?? bodyShape}
- Ratio Ombro/Quadril: ${ratios.shoulderHip?.toFixed(2)} ${getRatioStatus("shoulderHip", ratios.shoulderHip)}
- Ratio Ombro/Cintura: ${ratios.shoulderWaist?.toFixed(2)} ${getRatioStatus("shoulderWaist", ratios.shoulderWaist)}
- Ratio Cintura/Quadril: ${ratios.waistHip?.toFixed(2)} ${getRatioStatus("waistHip", ratios.waistHip)}
- Ratio Perna/Tronco: ${ratios.legTorso?.toFixed(2)} ${getRatioStatus("legTorso", ratios.legTorso)}

PROPORÇÕES IDEAIS DE REFERÊNCIA:
${IDEAL_RATIOS}

Largura estimada (pixels normalizados):
- Ombros: ${Math.round(measurements?.shoulderPx ?? 0)}px | Quadril: ${Math.round(measurements?.hipPx ?? 0)}px

Agora analise esse aluno como um coach de bodybuilding experiente ao lado dele. Seja específico, use os números, cruze com o objetivo, diga o que falta e o que focar.`

    const { text } = await generateText({
      model: aiModel,
      system: SYSTEM_PROMPTS.bodyScanCoach,
      prompt,
      maxOutputTokens: 350,
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

function getRatioStatus(key: string, value: number): string {
  if (!value) return ""
  switch (key) {
    case "shoulderHip":
      if (value >= 1.45) return "✓ excelente"
      if (value >= 1.35) return "✓ bom"
      if (value >= 1.20) return "↗ abaixo do ideal"
      return "⚠ muito abaixo do ideal"
    case "shoulderWaist":
      if (value >= 1.45) return "✓ bom"
      if (value >= 1.30) return "↗ razoável"
      return "⚠ precisa melhorar"
    case "waistHip":
      if (value <= 0.80) return "✓ excelente"
      if (value <= 0.85) return "✓ bom"
      if (value <= 0.90) return "↗ aceitável"
      return "⚠ acima do ideal"
    case "legTorso":
      if (value >= 1.0 && value <= 1.3) return "✓ proporcional"
      if (value > 1.3) return "↗ pernas longas"
      return "↗ tronco longo"
    default:
      return ""
  }
}
