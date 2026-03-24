import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/ai-usage — dashboard de consumo de tokens IA
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // ─── Totais gerais ───
    const totals = await prisma.aiTokenUsage.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
      _count: true,
      _avg: { latencyMs: true },
    })

    // ─── Por feature ───
    const byFeature = await prisma.aiTokenUsage.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: since } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: true,
      _avg: { latencyMs: true },
      orderBy: { _sum: { totalTokens: "desc" } },
    })

    // ─── Por modelo ───
    const byModel = await prisma.aiTokenUsage.groupBy({
      by: ["model"],
      where: { createdAt: { gte: since } },
      _sum: { totalTokens: true },
      _count: true,
    })

    // ─── Por dia (últimos N dias) ───
    const daily = await prisma.$queryRawUnsafe<
      { date: string; tokens: bigint; calls: bigint }[]
    >(`
      SELECT
        DATE("createdAt") as date,
        SUM("totalTokens") as tokens,
        COUNT(*) as calls
      FROM "AiTokenUsage"
      WHERE "createdAt" >= $1
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT ${days}
    `, since)

    // ─── Erros recentes ───
    const errors = await prisma.aiTokenUsage.findMany({
      where: { success: false, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { feature: true, model: true, error: true, createdAt: true },
    })

    // ─── Hoje ───
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const today = await prisma.aiTokenUsage.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { totalTokens: true },
      _count: true,
    })

    // Groq free tier: 14.400 req/dia, ~500k tokens/dia
    const dailyLimit = 14400
    const todayCalls = today._count || 0
    const usagePercent = Math.round((todayCalls / dailyLimit) * 100)

    return NextResponse.json({
      period: { days, since },
      today: {
        calls: todayCalls,
        tokens: today._sum.totalTokens || 0,
        limit: dailyLimit,
        usagePercent,
        remaining: Math.max(dailyLimit - todayCalls, 0),
      },
      totals: {
        calls: totals._count,
        promptTokens: totals._sum.promptTokens || 0,
        completionTokens: totals._sum.completionTokens || 0,
        totalTokens: totals._sum.totalTokens || 0,
        avgLatencyMs: Math.round(totals._avg.latencyMs || 0),
      },
      byFeature: byFeature.map(f => ({
        feature: f.feature,
        calls: f._count,
        totalTokens: f._sum.totalTokens || 0,
        promptTokens: f._sum.promptTokens || 0,
        completionTokens: f._sum.completionTokens || 0,
        avgLatencyMs: Math.round(f._avg.latencyMs || 0),
      })),
      byModel: byModel.map(m => ({
        model: m.model,
        calls: m._count,
        totalTokens: m._sum.totalTokens || 0,
      })),
      daily: daily.map(d => ({
        date: String(d.date),
        tokens: Number(d.tokens),
        calls: Number(d.calls),
      })),
      errors,
    })
  } catch (error) {
    console.error("GET /api/admin/ai-usage error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
