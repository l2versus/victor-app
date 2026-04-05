import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudent } from "@/lib/student"

// GET — check onboarding status + load existing data
export async function GET() {
  try {
    const { student } = await requireStudent({ skipOnboardingCheck: true })

    const screening = await prisma.healthScreening.findUnique({
      where: { studentId: student.id },
    })

    return NextResponse.json({
      onboardingComplete: student.onboardingComplete,
      screening,
      profile: {
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        avatar: student.user.avatar,
        birthDate: student.user.birthDate,
        gender: student.gender,
        weight: student.weight,
        height: student.height,
      },
    })
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
}

// POST — save onboarding (all steps at once or partial)
export async function POST(req: NextRequest) {
  try {
    const { student } = await requireStudent({ skipOnboardingCheck: true })
    const body = await req.json()

    const {
      // Profile basics
      name, phone, birthDate, gender, weight, height, avatar,
      // PAR-Q
      parqHeartCondition, parqChestPain, parqDizziness,
      parqBoneJoint, parqMedication, parqOtherReason,
      // Injuries & restrictions
      injuries, surgeries, restrictions, medicalNotes,
      // Training profile
      level, goal, frequency, equipment, sessionMinutes, experienceMonths,
      // Liability + LGPD
      liabilityAccepted, lgpdAccepted,
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (!gender) {
      return NextResponse.json({ error: "Gênero é obrigatório" }, { status: 400 })
    }
    if (!birthDate) {
      return NextResponse.json({ error: "Data de nascimento é obrigatória" }, { status: 400 })
    }
    if (!liabilityAccepted) {
      return NextResponse.json({ error: "Aceite o termo de responsabilidade" }, { status: 400 })
    }
    if (!lgpdAccepted) {
      return NextResponse.json({ error: "Aceite o termo de privacidade (LGPD)" }, { status: 400 })
    }

    // Avatar size cap (150KB decoded bytes)
    if (avatar && typeof avatar === "string") {
      const b64 = avatar.includes(",") ? avatar.split(",")[1] : avatar
      const estimatedBytes = (b64.length * 3) / 4
      if (estimatedBytes > 150_000) {
        return NextResponse.json({ error: "Foto muito grande (max 150KB)" }, { status: 400 })
      }
    }

    // Validate numeric fields
    const parsedWeight = weight ? parseFloat(weight) : null
    const parsedHeight = height ? parseFloat(height) : null
    const parsedFrequency = frequency ? parseInt(frequency) : 3
    const parsedSessionMin = sessionMinutes ? parseInt(sessionMinutes) : 60
    const parsedExpMonths = experienceMonths ? parseInt(experienceMonths) : 0

    if (parsedWeight !== null && (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 500)) {
      return NextResponse.json({ error: "Peso inválido" }, { status: 400 })
    }
    if (parsedHeight !== null && (isNaN(parsedHeight) || parsedHeight <= 0 || parsedHeight > 300)) {
      return NextResponse.json({ error: "Altura inválida" }, { status: 400 })
    }
    if (isNaN(parsedFrequency) || parsedFrequency < 1 || parsedFrequency > 7) {
      return NextResponse.json({ error: "Frequência inválida" }, { status: 400 })
    }

    // PAR-Q clearance: cleared if all answers are false
    const parqAnswers = [
      parqHeartCondition, parqChestPain, parqDizziness,
      parqBoneJoint, parqMedication, parqOtherReason,
    ]
    const parqCleared = !parqAnswers.some(Boolean)

    const now = new Date()

    // Build screening data (DRY — used in both create and update)
    const screeningData = {
      parqHeartCondition: !!parqHeartCondition,
      parqChestPain: !!parqChestPain,
      parqDizziness: !!parqDizziness,
      parqBoneJoint: !!parqBoneJoint,
      parqMedication: !!parqMedication,
      parqOtherReason: !!parqOtherReason,
      parqCleared,
      injuries: injuries || [],
      surgeries: surgeries || [],
      restrictions: restrictions || [],
      medicalNotes: medicalNotes || null,
      level: level || "BEGINNER",
      goal: goal || "HEALTH",
      frequency: parsedFrequency,
      equipment: equipment || "FULL_GYM",
      sessionMinutes: parsedSessionMin,
      experienceMonths: parsedExpMonths,
      liabilityAccepted: true,
      liabilitySignedAt: now,
      lgpdConsentAt: now,
      completedAt: now,
    }

    // Transaction: update User + Student + upsert HealthScreening
    await prisma.$transaction([
      // Update user profile
      prisma.user.update({
        where: { id: student.userId },
        data: {
          name: name.trim(),
          phone: phone || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          avatar: avatar || undefined,
        },
      }),
      // Update student profile
      prisma.student.update({
        where: { id: student.id },
        data: {
          gender: gender || null,
          weight: parsedWeight,
          height: parsedHeight,
          birthDate: birthDate ? new Date(birthDate) : null,
          onboardingComplete: true,
        },
      }),
      // Upsert health screening
      prisma.healthScreening.upsert({
        where: { studentId: student.id },
        create: { studentId: student.id, ...screeningData },
        update: screeningData,
      }),
    ])

    return NextResponse.json({ success: true, parqCleared })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Erro ao salvar onboarding" }, { status: 500 })
  }
}
