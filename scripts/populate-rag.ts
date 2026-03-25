/**
 * Popula o RAG (Knowledge Base) com documentos gerados a partir dos exercícios.
 * Agrupa por músculo e cria docs com:
 * - Instruções de execução em PT-BR
 * - Músculos sinergistas e antagonistas
 * - Dicas de forma e segurança
 * - Erros comuns
 *
 * Também cria docs de protocolos de treino, nutrição e prevenção de lesões.
 *
 * Uso: npx tsx scripts/populate-rag.ts
 */

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { embed } from "ai"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function generateEmbedding(text: string): Promise<number[]> {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  const model = google.textEmbeddingModel("gemini-embedding-001")
  const { embedding } = await embed({ model, value: text })
  return embedding
}

// ═══ Mapeamento de músculos sinergistas/antagonistas ═══

const MUSCLE_MAP: Record<string, { sinergistas: string[]; antagonistas: string[]; dicas: string }> = {
  Chest: {
    sinergistas: ["Tríceps", "Deltóide Anterior", "Serrátil Anterior"],
    antagonistas: ["Costas (Dorsal)", "Bíceps", "Deltóide Posterior"],
    dicas: "Mantenha escápulas retraídas e deprimidas. Não rebata a barra no peito. Controle a fase excêntrica (descida).",
  },
  Back: {
    sinergistas: ["Bíceps", "Trapézio", "Rombóides", "Deltóide Posterior"],
    antagonistas: ["Peito", "Tríceps", "Deltóide Anterior"],
    dicas: "Inicie o movimento com retração escapular. Evite usar impulso do quadril. Contraia no pico da contração.",
  },
  Shoulders: {
    sinergistas: ["Trapézio", "Tríceps (nos desenvolvimentos)", "Serrátil"],
    antagonistas: ["Dorsal (nos desenvolvimentos)", "Bíceps"],
    dicas: "Nunca force acima da dor. Aqueça rotadores antes. Evite elevações laterais acima de 90° se tiver impacto.",
  },
  Biceps: {
    sinergistas: ["Braquial", "Braquiorradial", "Antebraço"],
    antagonistas: ["Tríceps"],
    dicas: "Mantenha cotovelos fixos ao lado do corpo. Evite balanço do tronco. Controle a descida (3-4 segundos).",
  },
  Triceps: {
    sinergistas: ["Peito (nos multiarticulares)", "Deltóide Anterior"],
    antagonistas: ["Bíceps"],
    dicas: "Mantenha cotovelos próximos à cabeça nos exercícios acima. Extensão completa sem travar a articulação.",
  },
  Quadriceps: {
    sinergistas: ["Glúteos", "Core", "Adutores"],
    antagonistas: ["Posterior de Coxa (Isquiotibiais)"],
    dicas: "Joelhos alinhados com pontas dos pés. Não deixe joelhos passarem muito dos dedos. Desça até paralelo ou abaixo.",
  },
  Hamstrings: {
    sinergistas: ["Glúteos", "Eretores da Coluna", "Panturrilha"],
    antagonistas: ["Quadríceps"],
    dicas: "Mantenha coluna neutra nos stiffs. Sinta o alongamento na descida. Não hiperextenda o joelho na extensão.",
  },
  Glutes: {
    sinergistas: ["Posterior de Coxa", "Core", "Adutores"],
    antagonistas: ["Flexores do Quadril (Iliopsoas)"],
    dicas: "Contraia forte no topo (squeeze). Evite hiperextensão lombar. Pés afastados na largura dos ombros.",
  },
  Calves: {
    sinergistas: ["Tibial Anterior (antagonista direto)"],
    antagonistas: ["Tibial Anterior"],
    dicas: "Amplitude máxima — desça até alongar e suba até contrair no pico. Mantenha joelhos levemente flexionados no sentado.",
  },
  Core: {
    sinergistas: ["Oblíquos", "Transverso do Abdômen", "Eretores"],
    antagonistas: ["Eretores da Coluna (nos flexores)", "Reto Abdominal (nos extensores)"],
    dicas: "Respire corretamente — expire na contração. Mantenha lombar pressionada no chão nos abdominais. Não puxe o pescoço.",
  },
  Traps: {
    sinergistas: ["Rombóides", "Deltóide Posterior", "Eretores Cervicais"],
    antagonistas: ["Serrátil Anterior", "Peitoral Menor"],
    dicas: "Eleve os ombros verticalmente, não para frente. Segure 2 segundos no pico. Evite rotação de ombro.",
  },
  Forearms: {
    sinergistas: ["Bíceps", "Braquial"],
    antagonistas: ["Extensores do Punho"],
    dicas: "Use pegada completa (não só dedos). Varie entre pronada, supinada e neutra. Treine em alta repetição (15-20).",
  },
  "Full Body": {
    sinergistas: ["Todos os grupos musculares"],
    antagonistas: ["Nenhum específico"],
    dicas: "Mantenha técnica impecável em cada fase. Priorize padrões de movimento sobre carga. Aqueça todas as articulações.",
  },
}

// ═══ Documentos de protocolos e conhecimento geral ═══

const PROTOCOL_DOCS = [
  {
    title: "Periodização Linear — Como Progredir Cargas",
    category: "PROTOCOL",
    tags: ["periodização", "progressão", "carga", "hipertrofia"],
    content: `A periodização linear é o método mais simples e eficaz para iniciantes e intermediários.

COMO FUNCIONA:
- Semana 1-4: 3×12 com carga moderada (RPE 7)
- Semana 5-8: 4×10 com carga média-alta (RPE 8)
- Semana 9-12: 4×8 com carga alta (RPE 8-9)
- Semana 13: Deload — 2×12 com 50% da carga (recuperação)

REGRAS DE PROGRESSÃO:
- Conseguiu fazer todas as séries com a repetição máxima? Aumente 2.5kg (MMSS) ou 5kg (MMII)
- Não conseguiu completar? Mantenha a mesma carga na próxima sessão
- 3 sessões seguidas sem progredir? Reduza 10% e reconstrua

SINAIS DE OVERTRAINING:
- RPE consistentemente acima de 9 por mais de 2 semanas
- Dor articular (não muscular) persistente
- Queda de performance por 2+ sessões seguidas
- Insônia, irritabilidade, falta de apetite`,
  },
  {
    title: "Aquecimento Ideal — Protocolo de Ativação",
    category: "PROTOCOL",
    tags: ["aquecimento", "ativação", "mobilidade", "prevenção"],
    content: `O aquecimento correto previne lesões e melhora a performance em até 15%.

PROTOCOLO EM 3 FASES (8-10 minutos):

FASE 1 — Elevação da Temperatura (3 min):
- Esteira ou bike em ritmo leve
- Objetivo: aquecer o corpo, não cansar

FASE 2 — Mobilidade Articular (3 min):
- Rotação de ombros, quadril, tornozelos
- CAR (Controlled Articular Rotations) das articulações que serão usadas
- Alongamento dinâmico (balístico leve) — NUNCA estático antes do treino

FASE 3 — Ativação Específica (2-4 min):
- 1-2 séries do primeiro exercício com 40-50% da carga de trabalho
- Foco em padrão de movimento correto
- Pode usar elásticos para ativação de rotadores (dia de ombro/peito)

REGRA DE OURO: O aquecimento deve preparar, não esgotar.`,
  },
  {
    title: "Descanso Entre Séries — Quanto Tempo?",
    category: "PROTOCOL",
    tags: ["descanso", "intervalo", "séries", "recuperação"],
    content: `O tempo de descanso entre séries afeta diretamente seus resultados.

PARA HIPERTROFIA (ganho de massa):
- Exercícios compostos (agachamento, supino, remada): 2-3 minutos
- Exercícios isoladores (rosca, elevação lateral): 60-90 segundos
- Drop sets / Supersets: 0-30 segundos entre drops, 2 min entre supersets

PARA FORÇA MÁXIMA:
- 3-5 minutos entre séries pesadas (85%+ 1RM)
- Necessário para recuperação do sistema nervoso

PARA RESISTÊNCIA MUSCULAR:
- 30-60 segundos
- Mantém o acúmulo metabólico (pump)

DICA: Use o timer do app para cronometrar. Se o descanso está longo demais, você perde o pump. Se está curto demais, perde performance na próxima série.`,
  },
  {
    title: "Nutrição Pós-Treino — Janela Anabólica",
    category: "NUTRITION",
    tags: ["pós-treino", "proteína", "carboidrato", "recuperação", "janela anabólica"],
    content: `A refeição pós-treino é crucial para recuperação e crescimento muscular.

O QUE COMER DEPOIS DO TREINO:
- Proteína: 20-40g de proteína de alta qualidade (whey, frango, ovos)
- Carboidrato: 40-80g de carboidrato de médio/alto índice glicêmico (arroz, batata, frutas)
- Proporção ideal: 1:2 proteína:carboidrato

TIMING:
- Até 2 horas pós-treino (a "janela" não é tão rígida quanto se pensava)
- Se treinou em jejum, priorize comer o mais rápido possível

EXEMPLOS PRÁTICOS:
- Whey + banana + aveia (shake rápido)
- Frango + arroz + salada (refeição completa)
- Ovos + pão integral + suco natural
- Iogurte grego + granola + mel

HIDRATAÇÃO:
- Beba 500-750ml de água na primeira hora pós-treino
- Se treinou mais de 1h ou suou muito, adicione eletrólitos`,
  },
  {
    title: "Déficit vs Superávit Calórico — Como Funciona",
    category: "NUTRITION",
    tags: ["déficit", "superávit", "calorias", "emagrecimento", "massa", "bulking", "cutting"],
    content: `Entender seu balanço calórico é a base de qualquer objetivo.

DÉFICIT CALÓRICO (perder gordura):
- Consumir 300-500kcal ABAIXO do seu TDEE (gasto total diário)
- Objetivo: perder 0.5-1kg por semana (mais que isso = perda muscular)
- Mantenha proteína ALTA (1.8-2.2g/kg) para preservar massa magra
- Déficit moderado = sustentável. Déficit agressivo = rebote

SUPERÁVIT CALÓRICO (ganhar massa):
- Consumir 200-400kcal ACIMA do seu TDEE
- Objetivo: ganhar 0.25-0.5kg por semana (mais que isso = mais gordura)
- Proteína: 1.6-2.0g/kg
- Superávit leve (lean bulk) > superávit agressivo (dirty bulk)

MANUTENÇÃO:
- Consumir próximo ao TDEE (±100kcal)
- Ideal para recomposição corporal em iniciantes
- Foco em qualidade dos macros, não só calorias

COMO CALCULAR SEU TDEE:
- TMB (Mifflin-St Jeor) × Fator de Atividade
- Homem: TMB = 10×peso(kg) + 6.25×altura(cm) - 5×idade - 5
- Mulher: TMB = 10×peso(kg) + 6.25×altura(cm) - 5×idade - 161
- Fator: Sedentário 1.2 | Leve 1.375 | Moderado 1.55 | Intenso 1.725`,
  },
  {
    title: "Prevenção de Lesões — Sinais de Alerta",
    category: "INJURY",
    tags: ["lesão", "prevenção", "dor", "articulação", "tendão"],
    content: `Prevenir é sempre melhor que tratar. Conheça os sinais de alerta.

SINAIS DE ALERTA (pare imediatamente):
🔴 Dor aguda/pontada durante o exercício
🔴 Dor articular (não muscular) que piora com carga
🔴 Estalo seguido de dor e inchaço
🔴 Dormência ou formigamento durante exercício
🔴 Dor que não melhora com 48h de descanso

SINAIS DE ATENÇÃO (ajuste a abordagem):
🟡 Desconforto que aparece sempre no mesmo exercício → substitua temporariamente
🟡 Dor muscular que dura mais de 72h → reduza volume
🟡 Crepitação (estalo sem dor) → monitore, geralmente benigno
🟡 Fadiga excessiva mesmo com descanso adequado → overtraining

PREVENÇÃO:
- Aquecimento adequado (SEMPRE)
- Progressão gradual de carga (não pule etapas)
- Técnica correta > carga pesada
- Dormir 7-9 horas
- Hidratação adequada (mínimo 35ml/kg/dia)
- Deload a cada 4-6 semanas`,
  },
  {
    title: "Respiração Correta no Treino — Técnica Valsalva",
    category: "PROTOCOL",
    tags: ["respiração", "valsalva", "bracing", "core", "segurança"],
    content: `A respiração correta aumenta a força e protege a coluna.

REGRA GERAL:
- EXPIRE na fase concêntrica (esforço — empurrando/puxando)
- INSPIRE na fase excêntrica (descida/alongamento)

TÉCNICA VALSALVA (exercícios pesados):
1. Inspire profundo antes de iniciar o movimento
2. Prenda a respiração e contraia o core (bracing)
3. Execute o movimento mantendo a pressão intra-abdominal
4. Expire ao completar a fase concêntrica
5. Use em: agachamento, terra, supino pesado

QUANDO NÃO USAR VALSALVA:
- Exercícios isoladores leves
- Se tem pressão alta não controlada
- Se sente tontura ou escurecimento da visão
- Em séries de alta repetição (15+)

BRACING DO CORE:
- Contraia como se fosse levar um soco no estômago
- Mantenha durante TODO o movimento
- Isso cria um "cinto natural" que protege a coluna`,
  },
  {
    title: "Técnicas de Intensidade — Drop Set, Rest-Pause, Supersets",
    category: "PROTOCOL",
    tags: ["drop set", "rest-pause", "superset", "intensidade", "avançado"],
    content: `Técnicas avançadas para romper platôs e aumentar a intensidade.

DROP SET:
- Complete a série até a falha, reduza 20-30% da carga, continue sem descanso
- Faça 1-3 drops por série
- Ideal para: último exercício do grupo muscular
- Cuidado: gera MUITA fadiga, use com moderação (1-2x por treino)

REST-PAUSE:
- Complete a série até a falha, descanse 10-15 segundos, continue com mesma carga
- Faça 2-3 mini-séries
- Ideal para: exercícios compostos quando quer volume extra

SUPERSET:
- Dois exercícios seguidos sem descanso
- Agonista/Antagonista: Supino + Remada (mais eficiente)
- Mesmo músculo: Rosca direta + Rosca martelo (mais intenso)
- Descanse 2 min entre supersets completos

QUANDO USAR:
- Platô de 3+ semanas sem progresso
- Fase de choque (1-2 semanas, não permanente)
- Quando tempo de treino é limitado (supersets)

QUANDO EVITAR:
- Iniciantes (< 6 meses)
- Exercícios técnicos complexos (terra, agachamento pesado)
- Se já está com fadiga acumulada / overreaching`,
  },
]

// ═══ Função principal ═══

async function main() {
  console.log("🧠 Populando RAG Knowledge Base...\n")

  // Encontrar o trainer principal
  const trainer = await prisma.trainerProfile.findFirst({
    orderBy: { students: { _count: "desc" } },
    select: { id: true, userId: true },
  })
  if (!trainer) { console.error("Nenhum trainer encontrado!"); return }
  console.log(`✅ Trainer encontrado: ${trainer.id}\n`)

  // Contar docs existentes
  const existingCount = await prisma.knowledgeDocument.count({ where: { trainerId: trainer.id } })
  console.log(`📚 Docs existentes: ${existingCount}\n`)

  // ── 1. Gerar docs por grupo muscular a partir dos exercícios ──
  const exercises = await prisma.exercise.findMany({
    where: { isCustom: false },
    select: { name: true, muscle: true, equipment: true, instructions: true },
    orderBy: [{ muscle: "asc" }, { equipment: "asc" }],
  })
  console.log(`💪 ${exercises.length} exercícios encontrados\n`)

  // Agrupar por músculo
  const byMuscle = new Map<string, typeof exercises>()
  for (const ex of exercises) {
    if (!byMuscle.has(ex.muscle)) byMuscle.set(ex.muscle, [])
    byMuscle.get(ex.muscle)!.push(ex)
  }

  let created = 0
  let skipped = 0

  for (const [muscle, exList] of byMuscle) {
    const info = MUSCLE_MAP[muscle] || {
      sinergistas: ["Variável"],
      antagonistas: ["Variável"],
      dicas: "Mantenha técnica correta e controle o movimento.",
    }

    // Traduz nomes do músculo
    const muscleNamePT: Record<string, string> = {
      Chest: "Peito", Back: "Costas", Shoulders: "Ombros", Biceps: "Bíceps",
      Triceps: "Tríceps", Quadriceps: "Quadríceps", Hamstrings: "Posterior de Coxa",
      Glutes: "Glúteos", Calves: "Panturrilha", Core: "Abdômen/Core",
      Traps: "Trapézio", Forearms: "Antebraço", "Full Body": "Corpo Inteiro",
      Cardio: "Cardio", Stretching: "Alongamento",
    }

    const title = `Guia Completo — ${muscleNamePT[muscle] || muscle} (${exList.length} exercícios)`

    // Checar se já existe
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { trainerId: trainer.id, title },
      select: { id: true },
    })
    if (existing) {
      console.log(`⏭️  Já existe: ${title}`)
      skipped++
      continue
    }

    // Agrupar exercícios por equipamento
    const byEquip = new Map<string, typeof exList>()
    for (const ex of exList) {
      if (!byEquip.has(ex.equipment)) byEquip.set(ex.equipment, [])
      byEquip.get(ex.equipment)!.push(ex)
    }

    const equipPT: Record<string, string> = {
      Barbell: "Barra", Dumbbell: "Halter", Cable: "Cabo", Machine: "Máquina",
      Bodyweight: "Peso Corporal", Kettlebell: "Kettlebell", Band: "Elástico", Other: "Outro",
    }

    let content = `GRUPO MUSCULAR: ${muscleNamePT[muscle] || muscle}\n\n`
    content += `MÚSCULOS SINERGISTAS: ${info.sinergistas.join(", ")}\n`
    content += `MÚSCULOS ANTAGONISTAS: ${info.antagonistas.join(", ")}\n\n`
    content += `DICAS DE EXECUÇÃO:\n${info.dicas}\n\n`
    content += `EXERCÍCIOS DISPONÍVEIS (${exList.length} total):\n\n`

    for (const [equip, eqs] of byEquip) {
      content += `▸ ${equipPT[equip] || equip}:\n`
      for (const ex of eqs) {
        content += `  • ${ex.name}`
        if (ex.instructions) content += ` — ${ex.instructions}`
        content += `\n`
      }
      content += `\n`
    }

    // Gerar embedding
    const textForEmbedding = `${title}\n${muscleNamePT[muscle]}\n${muscle}\n${content.slice(0, 2000)}`
    let embedding: number[] = []
    try {
      embedding = await generateEmbedding(textForEmbedding)
      console.log(`✅ Embedding gerado: ${title}`)
    } catch (err) {
      console.warn(`⚠️  Embedding falhou para: ${title}`, err)
    }

    await prisma.knowledgeDocument.create({
      data: {
        trainerId: trainer.id,
        title,
        content,
        category: "EXERCISE",
        tags: [muscleNamePT[muscle] || muscle, muscle, "exercícios", "guia"],
        embedding,
      },
    })
    created++
    console.log(`📝 Criado: ${title}`)

    // Rate limit para embeddings API
    await new Promise(r => setTimeout(r, 500))
  }

  // ── 2. Criar docs de protocolos e nutrição ──
  console.log("\n📋 Criando docs de protocolos e nutrição...\n")

  for (const doc of PROTOCOL_DOCS) {
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { trainerId: trainer.id, title: doc.title },
      select: { id: true },
    })
    if (existing) {
      console.log(`⏭️  Já existe: ${doc.title}`)
      skipped++
      continue
    }

    const textForEmbedding = `${doc.title}\n${doc.tags.join(", ")}\n${doc.content.slice(0, 2000)}`
    let embedding: number[] = []
    try {
      embedding = await generateEmbedding(textForEmbedding)
      console.log(`✅ Embedding gerado: ${doc.title}`)
    } catch (err) {
      console.warn(`⚠️  Embedding falhou para: ${doc.title}`, err)
    }

    await prisma.knowledgeDocument.create({
      data: {
        trainerId: trainer.id,
        title: doc.title,
        content: doc.content,
        category: doc.category as "EXERCISE" | "PROTOCOL" | "NUTRITION" | "INJURY",
        tags: doc.tags,
        embedding,
      },
    })
    created++
    console.log(`📝 Criado: ${doc.title}`)

    await new Promise(r => setTimeout(r, 500))
  }

  // ── Resumo ──
  const finalCount = await prisma.knowledgeDocument.count({ where: { trainerId: trainer.id } })
  console.log(`\n═══════════════════════════════════════`)
  console.log(`📊 RESUMO:`)
  console.log(`   Antes: ${existingCount} docs`)
  console.log(`   Criados: ${created} docs`)
  console.log(`   Pulados (já existiam): ${skipped} docs`)
  console.log(`   Total agora: ${finalCount} docs`)
  console.log(`═══════════════════════════════════════\n`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
