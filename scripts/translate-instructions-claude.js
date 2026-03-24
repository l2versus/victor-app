const pg = require("pg")

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) { console.error("Set ANTHROPIC_API_KEY env var"); process.exit(1) }

async function translateBatch(items) {
  const prompt = items.map((it, i) => `${i + 1}. [${it.name}] ${it.instructions}`).join("\n")

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Traduza estas instruções de exercícios de academia para português brasileiro.
Regras:
- 1-2 frases curtas e diretas
- Linguagem simples para aluno leigo
- Descreva o movimento principal
- NÃO repita o nome do exercício
- Retorne APENAS um JSON array com as traduções na mesma ordem

${prompt}

Responda SOMENTE com o JSON array, sem markdown.`
      }],
    }),
  })

  const data = await res.json()
  const text = data.content?.[0]?.text?.trim()
  if (!text) throw new Error(`Empty: ${JSON.stringify(data)}`)
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(clean)
}

async function main() {
  const client = new pg.Client({
    host: "187.77.226.144", port: 5433, user: "postgres",
    password: "GxrbBZwZliStmYTi58BVifHPm4W3lPXK4ZuPZZBIvUZxBSoo96i41yr0ijEki07U",
    database: "postgres",
  })
  await client.connect()

  // Get exercises with mixed/English instructions (contain common English words)
  const result = await client.query(`
    SELECT id, name, instructions FROM "Exercise"
    WHERE instructions IS NOT NULL
    AND (
      instructions ~* '\\y(stand|sit|lie|grip|hold|push|pull|press|curl|lower|raise|squeeze|drive|keep|place|step|hang|alternate|repeat|slowly|return|your|the|with|and|then|while|from|into|each|both|arm|leg|back|chest|hip|knee|elbow|shoulder|feet|hand|weight|bar|bench|cable|rope)\\y'
    )
    ORDER BY name
  `)

  console.log(`Exercícios com inglês: ${result.rows.length}`)

  const BATCH = 15
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
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`  Batch ${Math.floor(i / BATCH) + 1} FALHOU:`, err.message?.substring(0, 100))
    }
  }

  console.log(`\nTotal traduzido: ${translated}/${result.rows.length}`)
  await client.end()
}

main().catch(e => console.error(e))
