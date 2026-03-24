import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizePhone, phoneSearchSuffix } from "@/lib/phone"

// Rate limit: simple in-memory counter (reset on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10 // max requests
const RATE_WINDOW = 60_000 // per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

// POST /api/leads/capture — endpoint PÚBLICO (sem auth)
// Usado por: landing page, chat widget, abandono checkout, forms externos
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas requisições. Tente em 1 minuto." }, { status: 429 })
  }

  try {
    const body = await req.json()

    const {
      name,
      phone,
      email,
      source = "WEBSITE",
      tags = [],
      notes,
      value,
      temperature = "WARM",
      planInterest,    // qual plano o visitante estava vendo
      utm_source,      // tracking
      utm_campaign,
    } = body

    if (!name && !phone && !email) {
      return NextResponse.json({ error: "Pelo menos nome, telefone ou email é obrigatório" }, { status: 400 })
    }

    // Buscar trainer (owner)
    const trainer = await prisma.trainerProfile.findFirst({
      select: { id: true, userId: true },
      orderBy: { createdAt: "asc" },
    })
    if (!trainer) {
      return NextResponse.json({ error: "Nenhum trainer configurado" }, { status: 500 })
    }

    // Checar duplicata por telefone
    let existingLead = null
    if (phone) {
      const suffix = phoneSearchSuffix(phone)
      if (suffix) {
        existingLead = await prisma.lead.findFirst({
          where: { trainerId: trainer.id, phone: { contains: suffix } },
        })
      }
    }

    // Se já existe, atualizar com novo contato
    if (existingLead) {
      const noteText = [
        notes,
        planInterest && `Interesse: plano ${planInterest}`,
        utm_source && `utm_source: ${utm_source}`,
        utm_campaign && `utm_campaign: ${utm_campaign}`,
      ].filter(Boolean).join(" | ")

      await prisma.leadFollowUp.create({
        data: {
          leadId: existingLead.id,
          type: "NOTE",
          content: noteText || `Novo contato via ${source}`,
        },
      })

      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          lastContactAt: new Date(),
          // Esquentar se voltou (mas nunca esfriar)
          ...(temperature === "HOT" && existingLead.temperature !== "HOT"
            ? { temperature: "HOT" }
            : {}),
        },
      })

      await prisma.crmActivity.create({
        data: {
          leadId: existingLead.id,
          action: "NOTE_ADDED",
          details: `Retorno via ${source}${planInterest ? ` — interesse no plano ${planInterest}` : ""}`,
        },
      })

      return NextResponse.json({
        success: true,
        leadId: existingLead.id,
        isNew: false,
        message: "Lead atualizado com novo contato",
      })
    }

    // Criar lead novo
    const validSources = ["WALK_IN", "REFERRAL", "INSTAGRAM", "WHATSAPP", "WEBSITE", "MANYCHAT", "FACEBOOK", "TIKTOK", "OTHER"]
    const validTemps = ["HOT", "WARM", "COLD"]

    const noteText = [
      notes,
      planInterest && `Interesse: plano ${planInterest}`,
      utm_source && `Fonte: ${utm_source}`,
      utm_campaign && `Campanha: ${utm_campaign}`,
    ].filter(Boolean).join(" | ")

    const lead = await prisma.lead.create({
      data: {
        trainerId: trainer.id,
        name: name || `Lead ${phone || email}`,
        phone: phone ? normalizePhone(phone) : null,
        email: email || null,
        source: validSources.includes(source) ? source : "WEBSITE",
        temperature: validTemps.includes(temperature) ? temperature : "WARM",
        notes: noteText || null,
        value: value ? parseFloat(String(value)) : null,
        tags: Array.isArray(tags) ? tags : [],
      },
    })

    await prisma.crmActivity.create({
      data: {
        leadId: lead.id,
        action: "CREATED",
        details: `Lead capturado via ${source}${planInterest ? ` — interesse: ${planInterest}` : ""}`,
      },
    })

    // Auto-score (fire-and-forget)
    import("@/lib/lead-scoring").then(m => m.scoreAndNotify(lead.id)).catch(() => {})

    // Notificar trainer
    await prisma.notification.create({
      data: {
        userId: trainer.userId,
        type: "new_lead",
        title: "Novo lead!",
        body: `${lead.name}${phone ? ` (${phone})` : ""} via ${source}${planInterest ? ` — ${planInterest}` : ""}`,
        metadata: { leadId: lead.id, source, planInterest },
      },
    })

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      isNew: true,
      message: "Lead capturado com sucesso",
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/leads/capture error:", error)
    return NextResponse.json({ error: "Falha ao capturar lead" }, { status: 500 })
  }
}
