/**
 * Organization-specific Bot Prompt Builder
 *
 * Builds a customized bot prompt by overlaying org-specific config
 * on top of the base bot prompt. NOT integrated into the live bot yet —
 * this is infrastructure for future white-label integration.
 *
 * Usage (future):
 *   const orgConfig = await getOrgBotConfig(orgId)
 *   if (orgConfig) {
 *     prompt = buildOrgBotPrompt(orgConfig, basePrompt)
 *   }
 */

import { prisma } from "./prisma"

// ═══ Types ═══

export interface OrgBotConfig {
  botName: string
  botPersonality: string
  botGreeting: string
  botLanguageStyle: "formal" | "informal" | "tecnico"
  prices: {
    plans: { name: string; price: number; features: string[] }[]
  }
  customRules: string[]
  whatsappNumber: string
  workingHours: string
  offHoursMessage: string
}

// ═══ Data access ═══

/**
 * Load the bot config for a specific organization.
 * Returns null if the org doesn't exist or has no bot config.
 */
export async function getOrgBotConfig(orgId: string): Promise<OrgBotConfig | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { brandConfig: true },
    })

    if (!org?.brandConfig) return null

    const brandConfig = org.brandConfig as Record<string, unknown>
    const botConfig = brandConfig.botConfig as OrgBotConfig | undefined

    if (!botConfig || !botConfig.botName) return null

    return botConfig
  } catch (error) {
    console.error("[OrgBotPrompt] Failed to load config for org:", orgId, error)
    return null
  }
}

// ═══ Prompt building ═══

const LANGUAGE_STYLE_INSTRUCTIONS: Record<string, string> = {
  formal:
    "Use linguagem formal e profissional. Trate o cliente por 'senhor/senhora'. Evite girias e abreviacoes.",
  informal:
    "Use linguagem informal e amigavel. Pode usar emojis e ser descontraido. Trate o cliente pelo primeiro nome.",
  tecnico:
    "Use linguagem tecnica e precisa. Cite termos da area quando relevante. Mantenha um tom profissional mas acessivel.",
}

/**
 * Build a customized prompt by overlaying org-specific config
 * on top of the base bot prompt.
 *
 * Transformations:
 * 1. Prepends org bot identity block (name, personality, greeting)
 * 2. Replaces default pricing with org-specific plans
 * 3. Injects org custom rules
 * 4. Adjusts language style
 * 5. Adds working hours / off-hours instructions
 */
export function buildOrgBotPrompt(orgConfig: OrgBotConfig, basePrompt: string): string {
  const sections: string[] = []

  // 1. Identity block
  sections.push(`=== IDENTIDADE DO BOT ===`)
  sections.push(`Seu nome e: ${orgConfig.botName}`)
  if (orgConfig.botPersonality) {
    sections.push(`Personalidade: ${orgConfig.botPersonality}`)
  }
  if (orgConfig.botGreeting) {
    sections.push(`Saudacao padrao (use na primeira mensagem): "${orgConfig.botGreeting}"`)
  }

  // 2. Language style
  const styleInstruction = LANGUAGE_STYLE_INSTRUCTIONS[orgConfig.botLanguageStyle]
  if (styleInstruction) {
    sections.push(`\n=== ESTILO DE LINGUAGEM ===`)
    sections.push(styleInstruction)
  }

  // 3. Pricing
  if (orgConfig.prices?.plans && orgConfig.prices.plans.length > 0) {
    sections.push(`\n=== PLANOS E PRECOS ===`)
    sections.push(`IMPORTANTE: Use APENAS estes planos ao falar sobre precos:`)
    for (const plan of orgConfig.prices.plans) {
      const features = plan.features.length > 0 ? ` (${plan.features.join(", ")})` : ""
      sections.push(`- ${plan.name}: R$ ${plan.price.toFixed(2)}/mes${features}`)
    }
  }

  // 4. Custom rules
  if (orgConfig.customRules && orgConfig.customRules.length > 0) {
    const validRules = orgConfig.customRules.filter((r) => r.trim())
    if (validRules.length > 0) {
      sections.push(`\n=== REGRAS OBRIGATORIAS ===`)
      sections.push(`Siga SEMPRE estas regras:`)
      for (const rule of validRules) {
        sections.push(`- ${rule}`)
      }
    }
  }

  // 5. Working hours
  if (orgConfig.workingHours) {
    sections.push(`\n=== HORARIO DE ATENDIMENTO ===`)
    sections.push(`Horario de funcionamento: ${orgConfig.workingHours}`)
    if (orgConfig.offHoursMessage) {
      sections.push(
        `Se o cliente enviar mensagem fora do horario, responda: "${orgConfig.offHoursMessage}"`
      )
    }
  }

  // 6. WhatsApp number reference
  if (orgConfig.whatsappNumber) {
    sections.push(`\nNumero de WhatsApp da empresa: ${orgConfig.whatsappNumber}`)
  }

  // Combine: org config block + separator + base prompt
  const orgBlock = sections.join("\n")

  return `${orgBlock}\n\n========================================\n\n${basePrompt}`
}
