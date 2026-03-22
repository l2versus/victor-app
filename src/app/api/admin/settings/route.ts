import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

// GET /api/admin/settings — get trainer profile + user info
export async function GET() {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, avatar: true, phone: true },
    })

    return NextResponse.json({
      profile: {
        id: trainer.id,
        bio: trainer.bio,
        cref: trainer.cref,
        logo: trainer.logo,
        brandColor: trainer.brandColor,
      },
      user,
    })
  } catch (error) {
    console.error("GET /api/admin/settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PATCH /api/admin/settings — update trainer profile + user info
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)
    const body = await req.json()

    const { bio, cref, logo, brandColor, name, phone } = body

    // Update trainer profile
    const profileData: Record<string, unknown> = {}
    if (bio !== undefined) profileData.bio = bio || null
    if (cref !== undefined) profileData.cref = cref || null
    if (logo !== undefined) profileData.logo = logo || null
    if (brandColor !== undefined) profileData.brandColor = brandColor

    if (Object.keys(profileData).length > 0) {
      await prisma.trainerProfile.update({
        where: { id: trainer.id },
        data: profileData,
      })
    }

    // Update user info
    const userData: Record<string, unknown> = {}
    if (name !== undefined) userData.name = name
    if (phone !== undefined) userData.phone = phone || null

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: session.userId },
        data: userData,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
