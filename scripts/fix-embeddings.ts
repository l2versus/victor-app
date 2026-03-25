/**
 * Atualiza embeddings de docs que foram criados sem embedding (API estava offline).
 * Uso: npx tsx scripts/fix-embeddings.ts
 */
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { embed } from "ai"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  const model = google.textEmbeddingModel("gemini-embedding-001")

  // Find docs with empty embeddings
  const docs = await prisma.knowledgeDocument.findMany({
    select: { id: true, title: true, content: true, tags: true, embedding: true },
  })

  const needsFix = docs.filter(d => !d.embedding || d.embedding.length === 0)
  console.log(`📊 Total docs: ${docs.length}, Sem embedding: ${needsFix.length}\n`)

  if (needsFix.length === 0) {
    console.log("✅ Todos os docs já têm embeddings!")
    await prisma.$disconnect()
    return
  }

  let fixed = 0
  for (const doc of needsFix) {
    try {
      const text = `${doc.title}\n${doc.tags.join(", ")}\n${doc.content.slice(0, 2000)}`
      const { embedding } = await embed({ model, value: text })

      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { embedding },
      })

      fixed++
      console.log(`✅ [${fixed}/${needsFix.length}] ${doc.title} (${embedding.length} dims)`)

      // Rate limit
      await new Promise(r => setTimeout(r, 400))
    } catch (err) {
      console.error(`❌ Falhou: ${doc.title}`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n🎉 Resultado: ${fixed}/${needsFix.length} embeddings atualizados`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
