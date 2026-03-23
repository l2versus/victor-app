import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const INDEX_PATH = join(process.cwd(), "public/models/machines/index.json")

type MachineEntry = { file: string; name: string; addedAt: string }

async function loadIndex(): Promise<Record<string, MachineEntry>> {
  const raw = await readFile(INDEX_PATH, "utf-8")
  return JSON.parse(raw)
}

// GET /api/admin/machines — list all 3D machines
export async function GET() {
  try {
    await requireAdmin()
    const index = await loadIndex()

    const machines = Object.entries(index).map(([slug, entry]) => ({
      slug,
      file: entry.file,
      name: entry.name,
      addedAt: entry.addedAt,
    }))

    return NextResponse.json({ machines })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// PATCH /api/admin/machines — rename a machine
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { slug, name } = await req.json()

    if (!slug || !name?.trim()) {
      return NextResponse.json({ error: "Slug e nome são obrigatórios" }, { status: 400 })
    }

    const index = await loadIndex()
    if (!index[slug]) {
      return NextResponse.json({ error: "Máquina não encontrada" }, { status: 404 })
    }

    index[slug].name = name.trim()
    await writeFile(INDEX_PATH, JSON.stringify(index, null, 2), "utf-8")

    return NextResponse.json({ success: true, machine: { slug, name: name.trim() } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
