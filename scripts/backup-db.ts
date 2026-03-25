import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { writeFileSync } from "fs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter }) as Record<string, any>

// All models from schema.prisma (camelCase)
const MODELS = [
  "user", "trainerProfile", "student", "exercise",
  "workoutTemplate", "workoutExercise", "studentWorkoutPlan",
  "workoutSession", "sessionSet", "workoutFeedback", "feedbackMessage",
  "assessment", "plan", "subscription", "payment", "operationalCost",
  "notification", "communityPost", "communityReaction", "communityLike",
  "communityComment", "follow", "story", "storyView", "directMessage",
  "bodyScan", "challenge", "challengeEntry", "nutritionLog",
  "pushSubscription", "progressPhoto", "scheduleSlot", "extraActivity",
  "workoutTemplateLibrary", "paymentReminder", "checkIn",
  "lead", "leadFollowUp", "crmActivity", "crmTemplate",
  "crmWebhook", "crmWebhookLog", "crmConversation", "crmMessage",
  "crmBroadcast", "crmBroadcastRecipient", "crmBotFlow",
  "aiTokenUsage", "machine3D", "knowledgeDocument",
]

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const filename = `backup-${timestamp}.json`

  console.log("Exportando dados do banco...\n")

  const data: Record<string, unknown> = { exportedAt: new Date().toISOString() }
  let total = 0

  for (const model of MODELS) {
    try {
      if (prisma[model]?.findMany) {
        const records = await prisma[model].findMany()
        data[model] = records
        if (records.length > 0) {
          console.log(`  ${model}: ${records.length}`)
          total += records.length
        }
      }
    } catch {
      // Table might not exist yet, skip
    }
  }

  const path = `c:/Users/admin/Desktop/${filename}`
  const json = JSON.stringify(data, null, 2)
  writeFileSync(path, json, "utf-8")

  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2)
  console.log(`\n--- BACKUP COMPLETO ---`)
  console.log(`Arquivo: ${path}`)
  console.log(`Total: ${total} registros | ${sizeMB} MB`)

  await (prisma as any).$disconnect()
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1) })
