import "dotenv/config"

async function test() {
  const baseUrl = process.env.APP_URL || "http://localhost:3000"
  const token = process.env.MASTER_CRM_WEBHOOK_TOKEN || "test-token"

  console.log(`\n=== Testando ManyChat Integration ===`)
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Token: ${token.slice(0, 6)}...${token.slice(-4)}\n`)

  // Test 1: Webhook (lead capture)
  console.log("--- Teste 1: Webhook (captura de lead) ---")
  try {
    const webhookRes = await fetch(
      `${baseUrl}/api/master/crm/webhook?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Teste ManyChat",
          email: "teste@manychat.com",
          phone: "85999999999",
          type: "PERSONAL_TRAINER",
          source: "MANYCHAT",
          estimatedStudents: 20,
        }),
      }
    )
    const webhookData = await webhookRes.json()
    console.log(`Status: ${webhookRes.status}`)
    console.log(`Response:`, JSON.stringify(webhookData, null, 2))
    console.log(
      webhookRes.ok ? "PASSOU" : "FALHOU",
      "\n"
    )
  } catch (err) {
    console.log("ERRO:", (err as Error).message, "\n")
  }

  // Test 2: AI Reply
  console.log("--- Teste 2: AI Reply (resposta IA) ---")
  try {
    const aiRes = await fetch(
      `${baseUrl}/api/master/crm/ai-reply?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Quanto custa o plano Pro? Tenho 50 alunos.",
          name: "Joao",
        }),
      }
    )
    const aiData = await aiRes.json()
    console.log(`Status: ${aiRes.status}`)
    console.log(`Response:`, JSON.stringify(aiData, null, 2))
    console.log(
      aiRes.ok ? "PASSOU" : "FALHOU",
      "\n"
    )
  } catch (err) {
    console.log("ERRO:", (err as Error).message, "\n")
  }

  // Test 3: AI Reply without message (should fail)
  console.log("--- Teste 3: AI Reply sem mensagem (deve retornar 400) ---")
  try {
    const failRes = await fetch(
      `${baseUrl}/api/master/crm/ai-reply?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Teste" }),
      }
    )
    const failData = await failRes.json()
    console.log(`Status: ${failRes.status}`)
    console.log(`Response:`, JSON.stringify(failData, null, 2))
    console.log(
      failRes.status === 400 ? "PASSOU" : "FALHOU",
      "\n"
    )
  } catch (err) {
    console.log("ERRO:", (err as Error).message, "\n")
  }

  // Test 4: AI Reply without token (should fail auth)
  console.log("--- Teste 4: AI Reply sem token (deve retornar 401) ---")
  try {
    const noAuthRes = await fetch(
      `${baseUrl}/api/master/crm/ai-reply?token=wrong-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Oi" }),
      }
    )
    const noAuthData = await noAuthRes.json()
    console.log(`Status: ${noAuthRes.status}`)
    console.log(`Response:`, JSON.stringify(noAuthData, null, 2))
    console.log(
      noAuthRes.status === 401 ? "PASSOU" : "FALHOU",
      "\n"
    )
  } catch (err) {
    console.log("ERRO:", (err as Error).message, "\n")
  }

  console.log("=== Testes concluidos ===\n")
}

test().catch(console.error)
