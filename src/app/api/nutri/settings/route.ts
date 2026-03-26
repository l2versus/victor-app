import { requireNutritionist } from "@/lib/auth"
import { getNutriProfile } from "@/lib/nutri"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    })

    return Response.json({
      profile: {
        id: nutri.id,
        name: user?.name ?? "",
        email: user?.email ?? "",
        bio: nutri.bio ?? "",
        crn: nutri.crn ?? "",
        specialty: nutri.specialty ?? "",
        logo: nutri.logo ?? "",
        brandColor: nutri.brandColor ?? "#10b981",
        onboardingComplete: nutri.onboardingComplete,
      },
    })
  } catch (error) {
    console.error("[Nutri Settings GET]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireNutritionist()
    const nutri = await getNutriProfile(session.userId)

    const body = await request.json()
    const { name, bio, crn, specialty, logo, brandColor } = body

    // Update user name if provided
    if (name && typeof name === "string" && name.trim().length > 0) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { name: name.trim() },
      })
    }

    // Update nutritionist profile
    const updated = await prisma.nutritionistProfile.update({
      where: { id: nutri.id },
      data: {
        ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
        ...(crn !== undefined ? { crn: crn.trim() || null } : {}),
        ...(specialty !== undefined ? { specialty: specialty.trim() || null } : {}),
        ...(logo !== undefined ? { logo: logo.trim() || null } : {}),
        ...(brandColor !== undefined ? { brandColor: brandColor.trim() || "#10b981" } : {}),
      },
    })

    return Response.json({
      profile: {
        id: updated.id,
        name: name?.trim() ?? "",
        bio: updated.bio ?? "",
        crn: updated.crn ?? "",
        specialty: updated.specialty ?? "",
        logo: updated.logo ?? "",
        brandColor: updated.brandColor ?? "#10b981",
        onboardingComplete: updated.onboardingComplete,
      },
    })
  } catch (error) {
    console.error("[Nutri Settings PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
