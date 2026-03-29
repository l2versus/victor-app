import { prisma } from "@/lib/prisma"

export interface LimitCheckResult {
  allowed: boolean
  current: number
  max: number
  reason?: string
}

/**
 * Check if the organization can add another student.
 * Returns { allowed: true } if no org (solo professional — no limits).
 */
export async function canAddStudent(orgId: string | null | undefined): Promise<LimitCheckResult> {
  if (!orgId) {
    return { allowed: true, current: 0, max: Infinity }
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      maxStudents: true,
      status: true,
      _count: { select: { students: true } },
    },
  })

  if (!org) {
    return { allowed: true, current: 0, max: Infinity }
  }

  // Blocked statuses — cannot add anything
  if (org.status === "SUSPENDED" || org.status === "CANCELLED") {
    return {
      allowed: false,
      current: org._count.students,
      max: org.maxStudents,
      reason: `Organizacao ${org.status === "SUSPENDED" ? "suspensa" : "cancelada"}. Nao e possivel adicionar alunos.`,
    }
  }

  const current = org._count.students
  const max = org.maxStudents

  if (current >= max) {
    return {
      allowed: false,
      current,
      max,
      reason: `Limite de ${max} alunos atingido (${current}/${max}). Faca upgrade do plano para adicionar mais.`,
    }
  }

  return { allowed: true, current, max }
}

/**
 * Check if the organization can add another professional (trainer or nutritionist).
 * Returns { allowed: true } if no org.
 */
export async function canAddProfessional(orgId: string | null | undefined): Promise<LimitCheckResult> {
  if (!orgId) {
    return { allowed: true, current: 0, max: Infinity }
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      maxProfessionals: true,
      status: true,
      _count: {
        select: {
          trainers: true,
          nutritionists: true,
        },
      },
    },
  })

  if (!org) {
    return { allowed: true, current: 0, max: Infinity }
  }

  // Blocked statuses
  if (org.status === "SUSPENDED" || org.status === "CANCELLED") {
    return {
      allowed: false,
      current: org._count.trainers + org._count.nutritionists,
      max: org.maxProfessionals,
      reason: `Organizacao ${org.status === "SUSPENDED" ? "suspensa" : "cancelada"}. Nao e possivel adicionar profissionais.`,
    }
  }

  const current = org._count.trainers + org._count.nutritionists
  const max = org.maxProfessionals

  if (current >= max) {
    return {
      allowed: false,
      current,
      max,
      reason: `Limite de ${max} profissionais atingido (${current}/${max}). Faca upgrade do plano.`,
    }
  }

  return { allowed: true, current, max }
}
