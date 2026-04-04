import { generateText } from "ai"
import { premiumModel, visionModel, SYSTEM_PROMPTS } from "@/lib/ai"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

type AttachmentInput = { type: "image" | "youtube" | "link" | "text"; data: string }

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return null
}

async function extractYouTubeTranscript(url: string): Promise<string | null> {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null
  try {
    let transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: "pt" })
    if (!transcripts || transcripts.length === 0) {
      transcripts = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" })
    }
    if (!transcripts || transcripts.length === 0) return null
    const full = transcripts.map(t => t.text).join(" ")
    return full.length > 6000 ? full.substring(0, 6000) + "..." : full
  } catch {
    return null
  }
}

async function analyzeImageWithVision(imageBase64: string): Promise<string | null> {
  try {
    const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
    const result = await generateText({
      model: visionModel,
      messages: [{
        role: "user",
        content: [
          { type: "image", image: imageUrl },
          {
            type: "text",
            text: "Analise esta imagem de treino/exercicio. Extraia TODOS os detalhes: nomes dos exercicios, series, repeticoes, carga, tempo de descanso, observacoes. Se for uma tabela, extraia tudo. Se for um exercicio sendo executado, identifique qual e. Responda em portugues brasileiro, de forma objetiva.",
          },
        ],
      }],
    })
    return result.text
  } catch (err) {
    console.error("[generate-workout] Vision model failed:", err instanceof Error ? err.message : err)
    return null
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (session.role !== "ADMIN" && session.role !== "MASTER") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const trainer = await prisma.trainerProfile.findUnique({ where: { userId: session.userId } })

  const {
    studentId, objective, level, restrictions, equipment, days, focus,
    freeText, attachments,
  } = await req.json() as {
    studentId?: string; objective?: string; level?: string; restrictions?: string
    equipment?: string; days?: string; focus?: string; freeText?: string
    attachments?: AttachmentInput[]
  }

  // Process attachments in parallel
  const extraContextParts: string[] = []

  if (attachments && attachments.length > 0) {
    const results = await Promise.allSettled(
      attachments.map(async (att) => {
        if (att.type === "image") {
          const analysis = await analyzeImageWithVision(att.data)
          if (!analysis) return null
          return `[IMAGEM ANALISADA]:\n${analysis}`
        }
        if (att.type === "youtube") {
          const transcript = await extractYouTubeTranscript(att.data)
          return transcript
            ? `[VIDEO YOUTUBE - ${att.data}]:\n${transcript}`
            : `[VIDEO YOUTUBE - ${att.data}]: Nao foi possivel extrair transcricao`
        }
        if (att.type === "link") {
          return `[LINK REFERENCIA]: ${att.data}`
        }
        if (att.type === "text") {
          return `[TEXTO ADICIONAL]:\n${att.data}`
        }
        return null
      })
    )
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) extraContextParts.push(r.value)
    }
  }

  if (freeText) {
    extraContextParts.push(`[INSTRUCOES DO TRAINER]:\n${freeText}`)
  }

  // Get student context if provided
  let studentContext = ""
  if (studentId && trainer) {
    const student = await prisma.student.findUnique({
      where: { id: studentId, trainerId: trainer.id },
      include: {
        user: { select: { name: true } },
        sessions: {
          orderBy: { startedAt: "desc" },
          take: 5,
          include: { template: { select: { name: true, type: true } } },
        },
        feedbacks: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { summary: true, rpe: true, painReported: true },
        },
      },
    })

    if (student) {
      const recentWorkouts = student.sessions
        .map((s: { template: { name: string; type: string } }) => `${s.template.name} (${s.template.type})`)
        .join(", ")

      const recentFeedback = student.feedbacks
        .map((f: { summary: string | null }) => f.summary || "sem resumo")
        .join("; ")

      studentContext = `
Aluno: ${student.user.name}
Peso: ${student.weight || "?"} kg | Altura: ${student.height || "?"} cm
Objetivo: ${student.goals || objective}
Restricoes: ${student.restrictions ? JSON.stringify(student.restrictions) : restrictions || "nenhuma"}
Treinos recentes: ${recentWorkouts || "nenhum"}
Feedback recente: ${recentFeedback || "nenhum"}`
    }
  }

  // Get available exercises for context
  const exerciseList = await prisma.exercise.findMany({
    where: { isActive: true },
    select: { name: true, muscle: true, equipment: true },
    take: 200,
  })

  const exerciseNames = exerciseList
    .map((e: { name: string; muscle: string; equipment: string }) => `${e.name} [${e.muscle}/${e.equipment}]`)
    .join("\n")

  const extraContext = extraContextParts.length > 0
    ? `\n\nCONTEXTO ADICIONAL (imagens, videos, links, texto do trainer):\n${extraContextParts.join("\n\n")}`
    : ""

  const prompt = `Gere um treino com as seguintes especificacoes:
Objetivo: ${objective || "baseado no contexto adicional abaixo"}
Nivel: ${level || "intermediario"}
Restricoes: ${restrictions || "nenhuma"}
Equipamentos: ${equipment || "academia completa"}
Foco: ${focus || "geral"}
Dias por semana: ${days || "3-4"}
${studentContext}${extraContext}

EXERCICIOS DISPONIVEIS NA BIBLIOTECA (USE ESTES NOMES EXATOS):
${exerciseNames}

IMPORTANTE: Use APENAS exercicios da lista acima. Se nao encontrar exatamente, use o mais proximo.
Se o contexto adicional contem um treino especifico (print, video, texto), ADAPTE-O usando os exercicios da biblioteca.`

  let result
  try {
    result = await generateText({
      model: premiumModel,
      system: SYSTEM_PROMPTS.workoutGenerator,
      messages: [{ role: "user", content: prompt }],
    })
  } catch (err) {
    console.error("[generate-workout] AI generation failed:", err instanceof Error ? err.message : err)
    return Response.json(
      { error: "Servico de IA temporariamente indisponivel. Tente novamente em alguns segundos." },
      { status: 503 }
    )
  }

  let workout
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[generate-workout] No JSON found in AI response:", result.text.substring(0, 300))
      return Response.json(
        { error: "A IA nao conseguiu gerar o treino. Tente descrever melhor o objetivo ou adicionar mais detalhes." },
        { status: 422 }
      )
    }
    workout = JSON.parse(jsonMatch[0])
  } catch {
    console.error("[generate-workout] JSON parse failed:", result.text.substring(0, 300))
    return Response.json(
      { error: "Erro ao processar resposta da IA. Tente novamente." },
      { status: 422 }
    )
  }

  return Response.json({ workout })
}
