/**
 * Water intake calculator based on scientific literature:
 * - Base: 35ml per kg of body weight (EFSA, 2010)
 * - Activity modifier: +500-1000ml for active individuals
 * - Goal modifier: fat loss = +300ml, hypertrophy = +500ml
 * - Climate: Brazil tropical = +300ml default
 *
 * References:
 * - EFSA Panel on Dietetic Products, Nutrition and Allergies (2010)
 * - American College of Sports Medicine (ACSM) Position Stand
 * - Casa et al. (2000) National Athletic Trainers' Association
 */

interface WaterParams {
  weightKg: number
  goal?: string        // FitnessGoal enum
  frequency?: number   // days per week
  sessionMinutes?: number
}

interface WaterResult {
  dailyMl: number           // total diário em ml
  dailyLiters: string       // formatado ex: "2.8"
  intervalMinutes: number   // intervalo ideal entre copos
  glassesPerDay: number     // copos de 250ml
  perGlassMl: number        // ml por copo (fixo 250)
  tips: string[]            // dicas personalizadas
}

export function calculateWaterIntake(params: WaterParams): WaterResult {
  const { weightKg, goal, frequency = 3, sessionMinutes = 60 } = params

  // Base: 35ml/kg (EFSA recommendation)
  let dailyMl = weightKg * 35

  // Activity level modifier based on weekly frequency + session duration
  const weeklyMinutes = frequency * sessionMinutes
  if (weeklyMinutes >= 300) {
    dailyMl += 1000 // very active: +1L
  } else if (weeklyMinutes >= 150) {
    dailyMl += 700  // active: +700ml
  } else {
    dailyMl += 500  // light activity: +500ml
  }

  // Goal modifier
  switch (goal) {
    case "HYPERTROPHY":
      dailyMl += 500 // protein synthesis + creatine hydration
      break
    case "FAT_LOSS":
      dailyMl += 300 // thermogenesis + metabolic waste
      break
    case "PERFORMANCE":
      dailyMl += 700 // sweat loss + electrolyte balance
      break
    case "REHABILITATION":
      dailyMl += 200 // tissue recovery
      break
    default: // HEALTH
      dailyMl += 100
  }

  // Brazil tropical climate baseline
  dailyMl += 300

  // Round to nearest 50ml
  dailyMl = Math.round(dailyMl / 50) * 50

  // Cap between 1.5L and 6L (safety)
  dailyMl = Math.max(1500, Math.min(6000, dailyMl))

  const perGlassMl = 250
  const glassesPerDay = Math.ceil(dailyMl / perGlassMl)

  // Interval: distribute across ~14 waking hours (06:00 - 22:00)
  const wakingMinutes = 14 * 60 // 840 minutes
  const intervalMinutes = Math.round(wakingMinutes / glassesPerDay)

  // Personalized tips
  const tips: string[] = []
  if (goal === "HYPERTROPHY") {
    tips.push("Beba 500ml nas 2h antes do treino para máxima hidratação muscular")
    tips.push("Água com pitada de sal durante treinos intensos (>60min)")
  }
  if (goal === "FAT_LOSS") {
    tips.push("Beba 500ml 30min antes das refeições — ajuda na saciedade")
    tips.push("Água gelada aumenta levemente o gasto calórico (termogênese)")
  }
  if (goal === "PERFORMANCE") {
    tips.push("Pese-se antes e depois do treino — reponha 150% do peso perdido em água")
  }
  if (weightKg > 90) {
    tips.push("Com seu peso, manter garrafas de 1L visíveis ajuda no controle")
  }
  tips.push("Urina clara = boa hidratação. Amarelo escuro = beba mais água")

  return {
    dailyMl,
    dailyLiters: (dailyMl / 1000).toFixed(1),
    intervalMinutes,
    glassesPerDay,
    perGlassMl,
    tips,
  }
}
