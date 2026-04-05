import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToStudent } from "@/lib/push"
import { calculateWaterIntake } from "@/lib/water-calculator"

// ═══════════════════════════════════════
// Daily Engagement Push — Vercel Cron
// 5x/dia: 08:00, 10:00, 12:00, 15:00, 18:00 BRT
// 08, 12, 18 = alimentação/treino
// 10, 15 = hidratação personalizada
// ═══════════════════════════════════════

// ── MEAL / TRAINING messages (08h, 12h, 18h) ──

const MORNING_MESSAGES = [
  { title: "Bom dia, guerreiro!", body: "Não pule o café da manhã. Seu corpo precisa de combustível para render no treino." },
  { title: "Manhã de campeão", body: "Proteína no café da manhã = músculos agradecidos o dia inteiro. Ovos, iogurte, aveia..." },
  { title: "Acorda que hoje tem treino!", body: "Comece o dia com um copo d'água e um café da manhã reforçado." },
  { title: "Seu corpo agradece", body: "Pular refeição desacelera seu metabolismo. Comece o dia certo!" },
  { title: "Energia pra hoje!", body: "Carboidrato complexo de manhã = energia pro treino. Aveia, pão integral, batata doce." },
  { title: "Foco na alimentação", body: "Resultado vem 70% da dieta. Planeje suas refeições de hoje agora!" },
  { title: "Bora que bora!", body: "Consistência > perfeição. Um café da manhã simples mas completo já faz diferença." },
]

const LUNCH_MESSAGES = [
  { title: "Hora do almoço!", body: "Não troque almoço por besteira. Prato colorido = treino com resultado." },
  { title: "Meio-dia, meio caminho", body: "Já comeu proteína hoje? Frango, peixe, ovo, leguminosa... seu músculo precisa." },
  { title: "Pausa pro almoço", body: "Comer correndo = digestão ruim = treino ruim. Mastigue devagar." },
  { title: "Check: alimentação OK?", body: "2 refeições feitas? Se pulou alguma, compensa agora. Não espere passar fome." },
  { title: "Seu treino de hoje", body: "Já sabe o que vai treinar? Abre o app e confere seu plano pra hoje." },
  { title: "Lanche da tarde vem aí", body: "Prepare um lanche saudável agora. Frutas, castanhas, iogurte > bolacha e salgadinho." },
  { title: "Não coma besteira!", body: "Aquela coxinha parece inofensiva, mas são 300kcal vazias. Troca por algo que te nutre." },
]

const EVENING_MESSAGES = [
  { title: "Jantar é importante!", body: "Não dormir sem comer. Seu corpo recupera durante o sono e precisa de nutrientes." },
  { title: "Fim de dia, hora de cuidar", body: "Como foi sua alimentação hoje? Registre no app e acompanhe sua evolução." },
  { title: "Treinou hoje?", body: "Se sim, manda ver no jantar com proteína. Se não, amanhã é dia! Descanse bem." },
  { title: "Recuperação começa agora", body: "Sono + alimentação = crescimento muscular. Nada de dormir de barriga vazia." },
  { title: "Evite besteira à noite", body: "Aquele doce depois do jantar? Troca por fruta com pasta de amendoim." },
  { title: "Não pule o jantar!", body: "Dormir sem comer = catabolismo. Proteína + carboidrato leve = recuperação ideal." },
  { title: "Amanhã é dia de evolução", body: "Planeje seu treino de amanhã agora. Quem planeja, executa." },
]

// ── WATER messages (10h, 15h) — personalized by weight ──

const WATER_MESSAGES = [
  { title: "Hora de beber água!", body: "Sua meta hoje é {meta}L. Já bebeu pelo menos {metade} copos? Se não, beba agora!" },
  { title: "Hidratação é performance", body: "2% de desidratação = 20% menos força. Beba seus {meta}L hoje — seu músculo agradece." },
  { title: "Beba água agora!", body: "Com {peso}kg, você precisa de pelo menos {meta}L por dia. Um copo a cada {intervalo}min." },
  { title: "Seu corpo pede água", body: "Urina amarela escura? Você tá devendo. Meta: {meta}L. Beba um copo grande agora!" },
  { title: "Pause e hidrate", body: "Não espere sentir sede — quando sente, já perdeu 1-2% de performance. Beba agora!" },
  { title: "Água + resultado", body: "Hidratação adequada melhora digestão, treino e até humor. Sua meta: {meta}L hoje." },
  { title: "Check de hidratação", body: "Meio do dia — já bebeu pelo menos {metade} copos de 250ml? Faltam {meta}L pra completar." },
]

type TimeSlot = "morning" | "water_am" | "lunch" | "water_pm" | "evening"

function getDayIndex(): number {
  return Math.floor(Date.now() / 86_400_000)
}

function getTimeSlot(hour: number): TimeSlot {
  if (hour < 9) return "morning"     // 08h BRT
  if (hour < 11) return "water_am"   // 10h BRT
  if (hour < 14) return "lunch"      // 12h BRT
  if (hour < 17) return "water_pm"   // 15h BRT
  return "evening"                    // 18h BRT
}

function isWaterSlot(slot: TimeSlot): boolean {
  return slot === "water_am" || slot === "water_pm"
}

function getMealMessage(slot: TimeSlot): { title: string; body: string } {
  const dayIndex = getDayIndex()
  const messages = slot === "morning" ? MORNING_MESSAGES : slot === "lunch" ? LUNCH_MESSAGES : EVENING_MESSAGES
  return messages[dayIndex % messages.length]
}

function getWaterMessage(weightKg: number, goal?: string | null): { title: string; body: string } {
  const dayIndex = getDayIndex()
  const template = WATER_MESSAGES[dayIndex % WATER_MESSAGES.length]

  const water = calculateWaterIntake({
    weightKg,
    goal: goal || undefined,
  })

  const title = template.title
  const body = template.body
    .replace("{meta}", water.dailyLiters)
    .replace("{metade}", Math.ceil(water.glassesPerDay / 2).toString())
    .replace("{peso}", Math.round(weightKg).toString())
    .replace("{intervalo}", water.intervalMinutes.toString())

  return { title, body }
}

// Process students in parallel chunks to avoid Vercel timeout
async function processStudentsInChunks(
  students: { id: string; userId: string; user: { name: string }; weight: number | null; healthScreening: { goal: string } | null }[],
  slot: TimeSlot,
  isTest: boolean,
) {
  let pushSent = 0
  let notifCreated = 0
  const CHUNK_SIZE = 25
  const water = isWaterSlot(slot)

  for (let i = 0; i < students.length; i += CHUNK_SIZE) {
    const chunk = students.slice(i, i + CHUNK_SIZE)

    const results = await Promise.allSettled(
      chunk.map(async (student) => {
        const firstName = student.user.name?.split(" ")[0] ?? "Aluno"

        let message: { title: string; body: string }
        if (water && student.weight) {
          message = getWaterMessage(student.weight, student.healthScreening?.goal)
        } else if (water) {
          // No weight data — generic water reminder
          message = { title: "Beba água agora!", body: `${firstName}, mantenha-se hidratado. Beba pelo menos 2L por dia.` }
        } else {
          message = getMealMessage(slot)
        }

        const personalBody = message.body.replace("{nome}", firstName)

        const sent = await sendPushToStudent(student.id, {
          title: message.title,
          body: personalBody,
          url: "/today",
          tag: isTest ? `engagement-${slot}-test` : `engagement-${slot}`,
        })

        return { studentUserId: student.userId, title: message.title, personalBody, sent }
      })
    )

    // Batch create in-app notifications
    const notifData = results
      .filter((r): r is PromiseFulfilledResult<{ studentUserId: string; title: string; personalBody: string; sent: boolean }> =>
        r.status === "fulfilled"
      )
      .map((r) => ({
        userId: r.value.studentUserId,
        type: water ? "water_reminder" : "engagement",
        title: r.value.title,
        body: r.value.personalBody,
        metadata: { slot, url: "/today", ...(isTest ? { test: true } : {}) },
      }))

    if (notifData.length > 0) {
      await prisma.notification.createMany({ data: notifData })
      notifCreated += notifData.length
    }

    pushSent += results.filter(
      (r) => r.status === "fulfilled" && r.value.sent
    ).length
  }

  return { pushSent, notifCreated }
}

// GET /api/cron/daily-engagement — Vercel Cron (5x/dia)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const brtHour = parseInt(
    new Intl.DateTimeFormat("en", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()),
    10
  )
  const slot = getTimeSlot(brtHour)

  // For water slots, include weight + health screening for personalization
  const students = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      userId: true,
      weight: true,
      user: { select: { name: true } },
      healthScreening: { select: { goal: true } },
    },
  })

  if (students.length === 0) {
    return NextResponse.json({ slot, students: 0, pushSent: 0, notifications: 0 })
  }

  const { pushSent, notifCreated } = await processStudentsInChunks(students, slot, false)

  return NextResponse.json({
    slot,
    type: isWaterSlot(slot) ? "water" : "meal/training",
    students: students.length,
    pushSent,
    notifications: notifCreated,
  })
}

// POST /api/cron/daily-engagement — Manual test (admin only)
export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/lib/auth")
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const validSlots: TimeSlot[] = ["morning", "water_am", "lunch", "water_pm", "evening"]
  const slot: TimeSlot = validSlots.includes(body.slot) ? body.slot : "morning"
  const targetId = body.studentId as string | undefined

  const students = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      pushSubscriptions: { some: {} },
      ...(targetId ? { id: targetId } : {}),
    },
    select: {
      id: true,
      userId: true,
      weight: true,
      user: { select: { name: true } },
      healthScreening: { select: { goal: true } },
    },
  })

  if (students.length === 0) {
    return NextResponse.json({ test: true, slot, students: 0, pushSent: 0, notifications: 0 })
  }

  const { pushSent, notifCreated } = await processStudentsInChunks(students, slot, true)

  return NextResponse.json({
    test: true,
    slot,
    type: isWaterSlot(slot) ? "water" : "meal/training",
    students: students.length,
    pushSent,
    notifications: notifCreated,
  })
}
