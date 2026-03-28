/**
 * Platform Settings — key/value store no banco pra configs do master admin.
 *
 * Usado pra: bot pause/resume, instruções customizadas, etc.
 */

import { prisma } from "./prisma"

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.platformSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function deleteSetting(key: string): Promise<void> {
  await prisma.platformSetting.deleteMany({ where: { key } })
}

// ═══ BOT-SPECIFIC HELPERS ═══

export async function isBotPaused(botType: string): Promise<boolean> {
  const val = await getSetting(`bot_${botType}_paused`)
  return val === "true"
}

export async function setBotPaused(botType: string, paused: boolean): Promise<void> {
  await setSetting(`bot_${botType}_paused`, paused ? "true" : "false")
}

export async function getBotCustomInstructions(botType: string): Promise<string | null> {
  return getSetting(`bot_${botType}_instructions`)
}

export async function setBotCustomInstructions(botType: string, instructions: string): Promise<void> {
  await setSetting(`bot_${botType}_instructions`, instructions)
}
