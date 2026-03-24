import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

type JsonEntry = { file: string; name: string; addedAt: string; videoUrl?: string }

// Seed DB from index.json on first GET if table is empty
async function seedFromJson() {
  const count = await prisma.machine3D.count()
  if (count > 0) return

  try {
    const raw = await readFile(join(process.cwd(), "public/models/machines/index.json"), "utf-8")
    const index: Record<string, JsonEntry> = JSON.parse(raw)
    const data = Object.entries(index).map(([slug, entry]) => ({
      slug,
      file: entry.file,
      name: entry.name,
      videoUrl: entry.videoUrl || null,
      addedAt: new Date(entry.addedAt),
    }))
    if (data.length > 0) {
      await prisma.machine3D.createMany({ data, skipDuplicates: true })
    }
  } catch {
    // index.json may not exist on Vercel — that's fine, table just stays empty until seeded
  }
}

// GET /api/admin/machines — list all 3D machines
export async function GET() {
  try {
    await requireAdmin()
    await seedFromJson()

    const machines = await prisma.machine3D.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, file: true, name: true, addedAt: true, videoUrl: true },
    })

    return NextResponse.json({
      machines: machines.map(m => ({
        ...m,
        addedAt: m.addedAt.toISOString().slice(0, 10),
        videoUrl: m.videoUrl || null,
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// PATCH /api/admin/machines — rename a machine
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { slug, name, videoUrl } = await req.json()

    if (!slug) {
      return NextResponse.json({ error: "Slug obrigatório" }, { status: 400 })
    }

    const existing = await prisma.machine3D.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: "Máquina não encontrada" }, { status: 404 })
    }

    const updated = await prisma.machine3D.update({
      where: { slug },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl || null } : {}),
      },
    })

    return NextResponse.json({ success: true, machine: { slug: updated.slug, name: updated.name } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
