import { requireNutritionist } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    await requireNutritionist()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)

    const foods = await prisma.food.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : {},
      take: limit,
      orderBy: { name: "asc" },
    })

    return Response.json({ foods })
  } catch (error) {
    console.error("[Nutri Foods GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireNutritionist()

    const body = await request.json()
    const { name, brand, servingSize, servingUnit, calories, protein, carbs, fat, fiber } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    if (calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return Response.json({ error: "Macros são obrigatórios (calories, protein, carbs, fat)" }, { status: 400 })
    }

    const food = await prisma.food.create({
      data: {
        name: name.trim(),
        brand: brand?.trim() || null,
        servingSize: servingSize ? parseFloat(servingSize) : 100,
        servingUnit: servingUnit || "g",
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        fiber: fiber ? parseFloat(fiber) : null,
        isCustom: true,
        createdById: session.userId,
      },
    })

    return Response.json({ food }, { status: 201 })
  } catch (error) {
    console.error("[Nutri Foods POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
