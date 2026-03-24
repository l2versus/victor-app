const pg = require("pg")

const GOOGLE_KEY = process.env.GOOGLE_AI_API_KEY
if (!GOOGLE_KEY) { console.error("Set GOOGLE_AI_API_KEY env var"); process.exit(1) }

async function translateBatch(items) {
  const prompt = items.map((it, i) => `${i + 1}. [${it.name}] ${it.instructions}`).join("\n")

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Traduza estas instruções de exercícios de academia para português brasileiro.
Regras:
- 1-2 frases curtas e diretas
- Linguagem simples para aluno leigo
- Descreva o movimento principal
- NÃO repita o nome do exercício
- Retorne APENAS um JSON array com as traduções na mesma ordem, sem markdown

${prompt}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
    }),
  })

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error(`Empty: ${JSON.stringify(data).substring(0, 200)}`)
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(clean)
}

async function main() {
  const client = new pg.Client({
    host: "187.77.226.144", port: 5433, user: "postgres",
    password: process.env.DB_PASSWORD || "GxrbBZwZliStmYTi58BVifHPm4W3lPXK4ZuPZZBIvUZxBSoo96i41yr0ijEki07U",
    database: "postgres",
  })
  await client.connect()

  const result = await client.query(`
    SELECT id, name, instructions FROM "Exercise"
    WHERE instructions IS NOT NULL
    AND instructions ~ '(Stand|Sit|Lie|Grip|Hold|Push|Pull|Press|Curl|Lower|Raise|Squeeze|Drive|Keep|Place|Step|Hang|with your|your |the bar| the | and |slowly)'
    ORDER BY name
  `)

  console.log(`Exercícios com inglês: ${result.rows.length}`)

  const BATCH = 12
  let translated = 0

  for (let i = 0; i < result.rows.length; i += BATCH) {
    const batch = result.rows.slice(i, i + BATCH)
    try {
      const translations = await translateBatch(batch)

      for (let j = 0; j < batch.length; j++) {
        if (translations[j] && typeof translations[j] === "string" && translations[j].length > 10) {
          await client.query('UPDATE "Exercise" SET instructions = $1 WHERE id = $2', [translations[j], batch[j].id])
          translated++
        }
      }
      console.log(`  Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(result.rows.length / BATCH)}: OK (${translated} total)`)
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.error(`  Batch ${Math.floor(i / BATCH) + 1} FALHOU:`, err.message?.substring(0, 150))
      // Try smaller batch
      for (const ex of batch) {
        try {
          const [t] = await translateBatch([ex])
          if (t && t.length > 10) {
            await client.query('UPDATE "Exercise" SET instructions = $1 WHERE id = $2', [t, ex.id])
            translated++
          }
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 200))
      }
    }
  }

  console.log(`\nTotal traduzido: ${translated}/${result.rows.length}`)
  await client.end()
}

main().catch(e => console.error(e))
