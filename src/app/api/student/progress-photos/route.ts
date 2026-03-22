import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/student/progress-photos
export async function GET() {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({ where: { userId: session.userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const photos = await prisma.progressPhoto.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("GET /api/student/progress-photos error:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

// POST /api/student/progress-photos — upload photo (base64 or URL)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({ where: { userId: session.userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const body = await req.json()
    const { imageUrl, category, weight, bodyFat, notes } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const photo = await prisma.progressPhoto.create({
      data: {
        studentId: student.id,
        imageUrl,
        category: category || "FRONT",
        weight: weight ? Number(weight) : null,
        bodyFat: bodyFat ? Number(bodyFat) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error("POST /api/student/progress-photos error:", error)
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }
}

// DELETE /api/student/progress-photos?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth()
    const student = await prisma.student.findUnique({ where: { userId: session.userId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Verify ownership
    const photo = await prisma.progressPhoto.findUnique({ where: { id } })
    if (!photo || photo.studentId !== student.id) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    await prisma.progressPhoto.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/student/progress-photos error:", error)
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 })
  }
}
