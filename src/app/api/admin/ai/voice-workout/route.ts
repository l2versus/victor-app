import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { generateText } from "ai"
import { premiumModel } from "@/lib/ai"
import { prisma } from "@/lib/prisma"

// POST /api/admin/ai/voice-workout — parse voice transcription into structured workout
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { transcription } = await req.json()

    if (!transcription || transcription.trim().length < 10) {
      return NextResponse.json(
        { error: "Transcrição muito curta. Fale o treino completo." },
        { status: 400 }
      )
    }

    // Get exercise library for matching
    const exercises = await prisma.exercise.findMany({
      select: { id: true, name: true, muscle: true, equipment: true },
      orderBy: { name: "asc" },
    })

    const exerciseList = exercises.map(e => `${e.name} (${e.muscle})`).join(", ")

    const result = await generateText({
      model: premiumModel,
      system: `Voce e um assistente que converte prescricoes de treino faladas por personal trainers em JSON estruturado.

O personal trainer vai FALAR o treino e voce recebe a transcricao. Extraia:
- Nome do treino
- Tipo (Push/Pull/Legs/Superior A/Superior B/Inferior A/Inferior B/Full Body/Cardio/Personalizado)
- Exercicios com series, repeticoes, descanso e observacoes

BIBLIOTECA DE EXERCICIOS DISPONIVEIS (use EXATAMENTE estes nomes):
${exerciseList}

IMPORTANTE:
- Se o trainer falar "supino", encontre o exercicio mais proximo na biblioteca (ex: "Supino Reto com Barra")
- Se falar "crucifixo", encontre "Crucifixo Inclinado com Halteres" ou similar
- Se falar abreviações como "3x10" ou "3 series de 10", interprete corretamente
- Descanso padrão: 60s se nao mencionado
- Se falar "bi-set" ou "super serie", agrupe com supersetGroup

Responda APENAS com JSON valido:
{
  "name": "Nome do Treino",
  "type": "Tipo",
  "notes": "Observacoes gerais ou null",
  "exercises": [
    {
      "exerciseName": "Nome EXATO da biblioteca",
      "sets": 3,
      "reps": "10-12",
      "restSeconds": 60,
      "notes": "observacao ou null",
      "supersetGroup": "A" ou null
    }
  ]
}`,
      prompt: `Transcricao do treino falado pelo personal trainer:\n\n"${transcription}"`,
    })

    // Parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Não consegui interpretar o treino. Tente falar mais devagar.", raw: result.text },
        { status: 422 }
      )
    }

    let workout
    try {
      workout = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar. Tente novamente.", raw: result.text },
        { status: 422 }
      )
    }

    // Resolve exercise names to IDs
    if (workout.exercises && Array.isArray(workout.exercises)) {
      for (const ex of workout.exercises) {
        if (ex.exerciseName) {
          const found = exercises.find(e =>
            e.name.toLowerCase() === ex.exerciseName.toLowerCase()
          ) || exercises.find(e =>
            e.name.toLowerCase().includes(ex.exerciseName.toLowerCase().split(" ")[0])
          )
          if (found) {
            ex.exerciseId = found.id
            ex.exercise = found
          }
        }
      }
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("POST /api/admin/ai/voice-workout error:", error)
    const msg = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: `Erro ao processar voz: ${msg}` }, { status: 500 })
  }
}
