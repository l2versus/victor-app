import { streamText } from "ai"
import { premiumModel } from "@/lib/ai"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkFeature } from "@/lib/subscription"
import { searchKnowledge, buildRAGContext } from "@/lib/rag"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.role !== "STUDENT") {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { messages, sessionId } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 })
    }

    const safeMessages = messages
      .filter((m: unknown) => {
        if (typeof m !== "object" || m === null) return false
        const msg = m as Record<string, unknown>
        return (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string"
      })
      .slice(-20)

    // ─── Load student with FULL context ─────────────────────────────────
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: {
        user: { select: { name: true, email: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: { select: { name: true, interval: true } } },
          take: 1,
        },
      },
    })

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 })
    }

    const hasAI = await checkFeature(student.id, "hasAI")
    if (!hasAI) {
      return Response.json(
        { error: "Seu plano atual não inclui o chat com IA. Faça upgrade para o plano Pro ou Elite para desbloquear!" },
        { status: 403 }
      )
    }

    // ─── Load historical data in parallel ────────────────────────────────
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      recentSessions,
      totalSessions,
      currentWorkout,
      latestBodyScan,
      recentNutrition,
      personalRecords,
    ] = await Promise.all([
      // Last 10 completed sessions with details
      prisma.workoutSession.findMany({
        where: { studentId: student.id, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 10,
        include: {
          template: { select: { name: true, type: true } },
          sets: true,
        },
      }),

      // Total sessions count + streak
      prisma.workoutSession.count({
        where: { studentId: student.id, completedAt: { not: null } },
      }),

      // Current workout session (if sessionId provided)
      sessionId
        ? prisma.workoutSession.findUnique({
            where: { id: sessionId, studentId: student.id },
            include: {
              template: {
                include: {
                  exercises: {
                    include: { exercise: { select: { name: true, muscle: true } } },
                    orderBy: { order: "asc" },
                  },
                },
              },
              sets: true,
            },
          })
        : null,

      // Latest body scan
      prisma.bodyScan.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      }),

      // Last 7 days nutrition
      prisma.nutritionLog.findMany({
        where: {
          studentId: student.id,
          date: { gte: sevenDaysAgo },
        },
        orderBy: { date: "desc" },
        take: 7,
      }),

      // Personal records (top load per exercise in last 30 days)
      prisma.sessionSet.findMany({
        where: {
          session: {
            studentId: student.id,
            completedAt: { gte: thirtyDaysAgo },
          },
          loadKg: { gt: 0 },
        },
        orderBy: { loadKg: "desc" },
        take: 10,
        distinct: ["exerciseId"],
      }),
    ])

    // ─── Build rich context ──────────────────────────────────────────────
    const age = student.birthDate
      ? Math.floor((now.getTime() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    const sessionsThisMonth = recentSessions.filter(
      (s) => s.completedAt && s.completedAt >= thirtyDaysAgo
    ).length

    const avgRPE = recentSessions.length > 0
      ? (recentSessions.reduce((sum, s) => sum + (s.rpe || 0), 0) / recentSessions.filter(s => s.rpe).length).toFixed(1)
      : null

    const avgDuration = recentSessions.length > 0
      ? Math.round(recentSessions.reduce((sum, s) => sum + (s.durationMin || 0), 0) / recentSessions.filter(s => s.durationMin).length)
      : null

    // Calculate streak
    let streak = 0
    const sessionDates = recentSessions
      .filter(s => s.completedAt)
      .map(s => s.completedAt!.toISOString().split("T")[0])
    const uniqueDates = [...new Set(sessionDates)]
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(now)
      expected.setDate(expected.getDate() - i)
      const expectedStr = expected.toISOString().split("T")[0]
      if (uniqueDates.includes(expectedStr)) {
        streak++
      } else {
        break
      }
    }

    // Current workout context
    let workoutContext = ""
    if (currentWorkout) {
      const exerciseList = currentWorkout.template.exercises
        .map((e) => {
          const completedSets = currentWorkout.sets.filter(s => s.exerciseId === e.exerciseId)
          const maxLoad = completedSets.length > 0
            ? Math.max(...completedSets.map(s => s.loadKg || 0))
            : null
          return `- ${e.exercise?.name || "Exercicio"} (${e.exercise?.muscle || "?"}): ${e.sets}x${e.reps}${maxLoad ? `, carga hoje: ${maxLoad}kg` : ""}`
        })
        .join("\n")

      workoutContext = `
TREINO DE HOJE:
${currentWorkout.template.name} (${currentWorkout.template.type})
Duracao: ${currentWorkout.durationMin || "em andamento"} min
RPE: ${currentWorkout.rpe || "ainda nao informado"}
Exercicios:
${exerciseList}
Sets completados: ${currentWorkout.sets.length}`
    }

    // Recent history summary
    const historyContext = recentSessions.length > 0
      ? recentSessions.slice(0, 5).map(s => {
          const totalVolume = s.sets.reduce((sum, set) => sum + (set.loadKg || 0) * (set.reps || 0), 0)
          return `- ${s.completedAt?.toLocaleDateString("pt-BR")}: ${s.template.name} (RPE ${s.rpe || "?"}, ${s.durationMin || "?"}min, volume ${totalVolume}kg)`
        }).join("\n")
      : "Nenhum treino recente"

    // PRs - lookup exercise names
    let prsContext = "Nenhum PR registrado"
    if (personalRecords.length > 0) {
      const exerciseIds = [...new Set(personalRecords.map(pr => pr.exerciseId))]
      const exercises = await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, name: true },
      })
      const exMap = new Map(exercises.map(e => [e.id, e.name]))
      prsContext = personalRecords.map(pr => `- ${exMap.get(pr.exerciseId) || "Exercicio"}: ${pr.loadKg}kg`).join("\n")
    }

    // Nutrition
    const nutritionContext = recentNutrition.length > 0
      ? (() => {
          const avgCal = Math.round(recentNutrition.reduce((s, n) => s + (n.totalCalories || 0), 0) / recentNutrition.length)
          const avgProt = Math.round(recentNutrition.reduce((s, n) => s + (n.protein || 0), 0) / recentNutrition.length)
          const avgWater = (recentNutrition.reduce((s, n) => s + (n.waterMl || 0), 0) / recentNutrition.length / 1000).toFixed(1)
          return `Media 7 dias: ${avgCal}cal, ${avgProt}g proteina, ${avgWater}L agua`
        })()
      : null

    // Body scan
    const bodyContext = latestBodyScan
      ? (() => {
          const ratios = latestBodyScan.ratios as Record<string, number> | null
          return `Shape: ${latestBodyScan.bodyShape || "?"}, Ratios: ${ratios ? JSON.stringify(ratios) : "?"}`
        })()
      : null

    const planName = student.subscriptions[0]?.plan?.name || "Sem plano"

    // ─── Energy balance: TDEE + deficit/surplus calculation ─────────────
    let energyContext = ""
    if (student.weight && student.height && age && student.gender) {
      // Mifflin-St Jeor BMR
      const bmr = student.gender === "MALE"
        ? 10 * student.weight + 6.25 * student.height - 5 * age + 5
        : 10 * student.weight + 6.25 * student.height - 5 * age - 161

      // Activity factor from weekly sessions
      const weeklySessionsCount = recentSessions.filter(s => {
        const d = s.completedAt ? (now.getTime() - s.completedAt.getTime()) / 86400000 : 999
        return d <= 7
      }).length
      const activityFactor = weeklySessionsCount >= 5 ? 1.725
        : weeklySessionsCount >= 3 ? 1.55
        : weeklySessionsCount >= 1 ? 1.375
        : 1.2
      const tdee = Math.round(bmr * activityFactor)

      // Workout calories estimate (MET-based)
      const avgSessionCal = avgDuration
        ? Math.round(avgDuration * (student.weight || 70) * 0.08) // ~MET 5 resistance training
        : 0

      // Caloric balance vs nutrition
      const avgCalIntake = recentNutrition.length > 0
        ? Math.round(recentNutrition.reduce((s, n) => s + (n.totalCalories || 0), 0) / recentNutrition.length)
        : 0
      const balance = avgCalIntake > 0 ? avgCalIntake - tdee : 0
      const balanceStatus = balance > 200 ? "SUPERÁVIT" : balance < -200 ? "DÉFICIT" : "MANUTENÇÃO"

      // Goal alignment
      const goal = (student.goals || "").toLowerCase()
      const wantsLoss = goal.includes("emagrec") || goal.includes("perder") || goal.includes("definir") || goal.includes("secar")
      const wantsGain = goal.includes("massa") || goal.includes("ganhar") || goal.includes("hipertrofia") || goal.includes("bulk")
      let alignment = "OK"
      if (wantsLoss && balance > 0) alignment = "DESALINHADO — quer perder peso mas está em superávit"
      if (wantsGain && balance < -200) alignment = "DESALINHADO — quer ganhar massa mas está em déficit"

      energyContext = `\nBALANÇO ENERGÉTICO:
TMB (Mifflin-St Jeor): ${Math.round(bmr)}kcal
TDEE estimado: ${tdee}kcal (fator ${activityFactor}x, ${weeklySessionsCount} treinos/semana)
Gasto por treino (estimado): ~${avgSessionCal}kcal
${avgCalIntake > 0 ? `Ingestão média (7 dias): ${avgCalIntake}kcal` : "Ingestão calórica: não registrada"}
${avgCalIntake > 0 ? `Balanço: ${balance > 0 ? "+" : ""}${balance}kcal/dia → ${balanceStatus}` : ""}
${avgCalIntake > 0 && alignment !== "OK" ? `⚠️ ${alignment}` : ""}
Proteína ideal: ${Math.round(student.weight * 1.8)}-${Math.round(student.weight * 2.2)}g/dia`
    }

    // ─── RAG: Search knowledge base for relevant context ────────────────
    let ragContext = ""
    try {
      const lastUserMsg = safeMessages.filter(m => m.role === "user").at(-1)?.content || ""
      if (lastUserMsg.length > 5) {
        const ragResults = await searchKnowledge(student.trainerId, lastUserMsg, { limit: 3, minScore: 0.35 })
        ragContext = buildRAGContext(ragResults)
      }
    } catch (err) {
      console.warn("[RAG] Search failed, continuing without:", err)
    }

    // ─── Build system prompt ─────────────────────────────────────────────
    const systemPrompt = `Voce e o Victor Oliveira, personal trainer de elite em Fortaleza/CE (CREF 016254-G/CE).
Voce NAO e um robo. Voce e o VICTOR. Fale como um coach de verdade que conhece o aluno pessoalmente.
Use portugues brasileiro casual, seja direto, motivador, e use girias fitness naturais.
Chame o aluno pelo primeiro nome. Seja breve (2-4 frases por resposta).

Quando o aluno terminar o treino, parabenize de forma genuina baseado nos dados reais.
Se o RPE foi alto (8+), reconheca o esforco. Se foi baixo, sugira aumentar carga.
Se bateu PR, comemore com entusiasmo.
Se o aluno tem restricoes, NUNCA sugira exercicios contraindicados.

PERFIL DO ALUNO:
Nome: ${student.user.name?.split(" ")[0] || "Aluno"}
${age ? `Idade: ${age} anos` : ""}
${student.weight ? `Peso: ${student.weight}kg` : ""}
${student.height ? `Altura: ${student.height}cm` : ""}
${student.gender ? `Genero: ${student.gender}` : ""}
Objetivo: ${student.goals || "nao definido"}
Restricoes: ${student.restrictions ? JSON.stringify(student.restrictions) : "nenhuma"}
Plano: ${planName}

HISTORICO:
Total de sessoes: ${totalSessions}
Sessoes este mes: ${sessionsThisMonth}
Streak atual: ${streak} dia${streak !== 1 ? "s" : ""} consecutivos
${avgRPE ? `RPE medio: ${avgRPE}/10` : ""}
${avgDuration ? `Duracao media: ${avgDuration}min` : ""}

ULTIMOS TREINOS:
${historyContext}

RECORDES PESSOAIS (30 dias):
${prsContext}

${nutritionContext ? `NUTRICAO:\n${nutritionContext}` : ""}
${energyContext}
${bodyContext ? `BODY SCAN:\n${bodyContext}` : ""}
${workoutContext}

REGRAS:
- Responda como Victor, NAO como IA
- Se o aluno perguntar algo fora do escopo (politica, etc), redirecione para treino
- Se nao souber algo especifico, diga "vou verificar e te passo pelo WhatsApp"
- Maximo 2-4 frases por resposta, seja direto
- Use dados reais do aluno para personalizar CADA resposta
- Se houver informacoes da base de conhecimento abaixo, USE-AS para responder com precisao cientifica
${ragContext}`

    const result = streamText({
      model: premiumModel,
      system: systemPrompt,
      messages: safeMessages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[Student Chat] Error:", error)
    const message = error instanceof Error ? error.message : "Erro interno"
    if (message === "Unauthorized") {
      return Response.json({ error: message }, { status: 401 })
    }
    return Response.json({ error: "Erro no chat. Tente novamente." }, { status: 500 })
  }
}
