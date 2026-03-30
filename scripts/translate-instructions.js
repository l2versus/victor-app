const pg = require("pg")

const GROQ_API_KEY = process.env.GROQ_API_KEY
if (!GROQ_API_KEY) { console.error("Set GROQ_API_KEY env var"); process.exit(1) }

async function translateBatch(instructions) {
  const prompt = `Traduza estas instruções de exercícios de academia do inglês para português brasileiro.
Mantenha curto e direto (1-2 frases). Use linguagem simples que um aluno leigo entenda.
Não adicione informações extras. Apenas traduza.

Retorne APENAS um JSON array com as traduções na mesma ordem:

${JSON.stringify(instructions)}

Responda SOMENTE com o JSON array, sem markdown, sem explicação.`

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error("Empty response from Groq")

  // Parse JSON - handle potential markdown wrapping
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(clean)
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  // Get all exercises with English instructions
  const result = await client.query(`
    SELECT id, name, instructions FROM "Exercise"
    WHERE instructions IS NOT NULL
    AND instructions ~ '^[A-Z][a-z]'
    AND instructions NOT LIKE '%Sente%'
    AND instructions NOT LIKE '%Ajuste%'
    AND instructions NOT LIKE '%Deite%'
    AND instructions NOT LIKE '%Fique%'
    AND instructions NOT LIKE '%Segure%'
    AND instructions NOT LIKE '%Em pé%'
    ORDER BY name
  `)

  console.log(`Exercícios com instruções em inglês: ${result.rows.length}`)

  // Process in batches of 10
  const BATCH = 10
  let translated = 0

  for (let i = 0; i < result.rows.length; i += BATCH) {
    const batch = result.rows.slice(i, i + BATCH)
    const instructions = batch.map(r => r.instructions)

    try {
      const translations = await translateBatch(instructions)

      for (let j = 0; j < batch.length; j++) {
        if (translations[j]) {
          await client.query(
            'UPDATE "Exercise" SET instructions = $1 WHERE id = $2',
            [translations[j], batch[j].id]
          )
          translated++
        }
      }

      console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} traduzidos (${batch[0].name} ... ${batch[batch.length - 1].name})`)

      // Rate limit: 500ms between batches
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.error(`  Batch ${Math.floor(i / BATCH) + 1} FALHOU:`, err.message)
      // Try one by one
      for (const ex of batch) {
        try {
          const [t] = await translateBatch([ex.instructions])
          if (t) {
            await client.query('UPDATE "Exercise" SET instructions = $1 WHERE id = $2', [t, ex.id])
            translated++
          }
        } catch { console.error(`    Falha individual: ${ex.name}`) }
        await new Promise(r => setTimeout(r, 200))
      }
    }
  }

  console.log(`\nTotal traduzido: ${translated}/${result.rows.length}`)
  await client.end()
}

main().catch(e => console.error(e.message))
