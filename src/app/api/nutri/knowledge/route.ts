import { requireNutritionist } from "@/lib/auth"
import { getNutriProfile } from "@/lib/nutri"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || undefined
    const search = searchParams.get("search") || ""

    const documents = await prisma.knowledgeDocument.findMany({
      where: {
        nutritionistId: nutri.id,
        ...(category ? { category: category as never } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { content: { contains: search, mode: "insensitive" as const } },
                { tags: { hasSome: [search.toLowerCase()] } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        sourceUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return Response.json({ documents })
  } catch (error) {
    console.error("[Nutri Knowledge GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const body = await request.json()
    const { title, content, category, tags, sourceUrl } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return Response.json({ error: "Titulo e obrigatorio" }, { status: 400 })
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "Conteudo e obrigatorio" }, { status: 400 })
    }

    const validCategories = [
      "EXERCISE", "MACHINE", "POSTURE", "NUTRITION",
      "SCIENCE", "PROTOCOL", "INJURY", "GENERAL",
    ]
    const cat = category && validCategories.includes(category) ? category : "GENERAL"

    // Parse tags: accept comma-separated string or array
    const parsedTags: string[] = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : typeof tags === "string"
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : []

    // trainerId is required on the schema (FK to TrainerProfile).
    // For nutri-owned docs, find a trainer in the same org as fallback.
    let trainerId: string | undefined

    if (nutri.organizationId) {
      const orgTrainer = await prisma.trainerProfile.findFirst({
        where: { organizationId: nutri.organizationId },
        select: { id: true },
      })
      trainerId = orgTrainer?.id
    }

    if (!trainerId) {
      // Absolute fallback: first trainer in the system
      const fallbackTrainer = await prisma.trainerProfile.findFirst({
        select: { id: true },
      })
      trainerId = fallbackTrainer?.id
    }

    if (!trainerId) {
      return Response.json({ error: "Nenhum trainer encontrado no sistema" }, { status: 500 })
    }

    const document = await prisma.knowledgeDocument.create({
      data: {
        trainerId,
        nutritionistId: nutri.id,
        title: title.trim(),
        content: content.trim(),
        category: cat,
        tags: parsedTags,
        sourceUrl: sourceUrl?.trim() || null,
        embedding: [],
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        sourceUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return Response.json({ document }, { status: 201 })
  } catch (error) {
    console.error("[Nutri Knowledge POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "ID e obrigatorio" }, { status: 400 })
    }

    // Verify ownership
    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id, nutritionistId: nutri.id },
    })

    if (!doc) {
      return Response.json({ error: "Documento nao encontrado" }, { status: 404 })
    }

    await prisma.knowledgeDocument.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("[Nutri Knowledge DELETE]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
