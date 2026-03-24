import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/machines — public list of 3D machines (used by student components)
export async function GET() {
  try {
    const machines = await prisma.machine3D.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, file: true, name: true, videoUrl: true, addedAt: true },
    })

    // Return as slug-keyed object (same shape as old index.json)
    const index: Record<string, { file: string; name: string; addedAt: string; videoUrl?: string }> = {}
    for (const m of machines) {
      index[m.slug] = {
        file: m.file,
        name: m.name,
        addedAt: m.addedAt.toISOString().slice(0, 10),
        ...(m.videoUrl ? { videoUrl: m.videoUrl } : {}),
      }
    }

    return NextResponse.json(index, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
