/**
 * SaaS Lead Scoring Engine for Master CRM
 *
 * Calculates a score 0-100 for platform sales leads (gyms, trainers, etc.)
 * and assigns temperature: HOT (>= 70), WARM (>= 40), COLD (< 40).
 *
 * Scoring factors:
 * - Contact info completeness (email, phone, company, city/state)
 * - Business type (ACADEMY = highest value)
 * - Estimated students count
 * - Estimated MRR
 */

export interface SaasScoreResult {
  score: number
  temperature: "HOT" | "WARM" | "COLD"
  label: string
  factors: {
    contactInfo: number
    businessType: number
    studentVolume: number
    mrrPotential: number
    location: number
  }
}

export function calculateSaasLeadScore(lead: {
  email?: string | null
  phone?: string | null
  company?: string | null
  type?: string | null
  estimatedStudents?: number | null
  estimatedMrr?: number | null
  city?: string | null
  state?: string | null
}): SaasScoreResult {
  let contactInfo = 0
  let businessType = 0
  let studentVolume = 0
  let mrrPotential = 0
  let location = 0

  // Contact info: email (+10), phone (+15), company (+15) = max 40
  if (lead.email) contactInfo += 10
  if (lead.phone) contactInfo += 15
  if (lead.company) contactInfo += 15

  // Business type: max 20
  switch (lead.type) {
    case "ACADEMY":
      businessType = 20
      break
    case "CLINIC":
      businessType = 15
      break
    case "PERSONAL_TRAINER":
      businessType = 10
      break
    case "NUTRITIONIST":
      businessType = 10
      break
    default:
      businessType = 5
  }

  // Estimated students: max 20
  const students = lead.estimatedStudents ?? 0
  if (students > 100) {
    studentVolume = 20
  } else if (students > 50) {
    studentVolume = 15
  } else if (students > 20) {
    studentVolume = 10
  } else if (students > 0) {
    studentVolume = 5
  }

  // Estimated MRR: max 15
  const mrr = lead.estimatedMrr ?? 0
  if (mrr > 500) {
    mrrPotential = 15
  } else if (mrr > 200) {
    mrrPotential = 10
  } else if (mrr > 0) {
    mrrPotential = 5
  }

  // Location: city/state filled (+5)
  if (lead.city || lead.state) {
    location = 5
  }

  const total = Math.min(contactInfo + businessType + studentVolume + mrrPotential + location, 100)

  const temperature: "HOT" | "WARM" | "COLD" =
    total >= 70 ? "HOT" : total >= 40 ? "WARM" : "COLD"

  const label =
    total >= 80 ? "Muito Quente" :
    total >= 70 ? "Quente" :
    total >= 50 ? "Morno" :
    total >= 30 ? "Frio" :
    "Gelado"

  return {
    score: total,
    temperature,
    label,
    factors: {
      contactInfo,
      businessType,
      studentVolume,
      mrrPotential,
      location,
    },
  }
}
