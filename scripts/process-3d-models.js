const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

// ══════════════════════════════════════════════════════════════════════════════
// SCRIPT: Processar modelos 3D (.glb) das máquinas do Victor Personal
//
// USO:
//   1. Coloque os arquivos .glb na pasta: scripts/glb-input/
//   2. Nomeie cada arquivo com o slug da máquina, ex:
//      - panatta-leg-press-45.glb
//      - hammer-mts-chest-press.glb
//      - matrix-rotary-torso.glb
//   3. Rode: node scripts/process-3d-models.js
//   4. Os modelos otimizados vão para: public/models/machines/
//   5. O mapeamento é salvo em: public/models/machines/index.json
//
// INSTALAÇÃO (primeira vez):
//   npm install -g @gltf-transform/cli
//
// SE NÃO QUISER OTIMIZAR:
//   Rode com --no-optimize: node scripts/process-3d-models.js --no-optimize
//   (só copia os arquivos sem comprimir)
// ══════════════════════════════════════════════════════════════════════════════

const INPUT_DIR = path.join(__dirname, "glb-input")
const OUTPUT_DIR = path.join(__dirname, "..", "public", "models", "machines")
const INDEX_FILE = path.join(OUTPUT_DIR, "index.json")
const SKIP_OPTIMIZE = process.argv.includes("--no-optimize")

// Mapeamento de slugs para nomes das máquinas (exercícios do banco)
const MACHINE_NAMES = {
  // ─── ABDOMINAL ───
  "matrix-abdominal-crunch": "Matrix Abdominal Crunch (cabo)",
  "hammer-seated-ab-crunch": "Hammer Strength Seated Ab Crunch",
  "nautilus-impact-abdominal": "Nautilus Impact Abdominal (cabo)",
  "hoist-rocit-ab-crunch": "Hoist ROC-IT Ab Crunch",
  "nautilus-inspiration-abdominal": "Nautilus Inspiration Abdominal (cabo)",
  "panatta-monolith-abdominal": "Panatta Monolith Abdominal Crunch (cabo)",
  "matrix-rotary-torso": "Matrix Rotary Torso",

  // ─── PEITO ───
  "hammer-mts-chest-press": "Hammer Strength MTS Iso-Lateral Chest Press",
  "hammer-mts-incline-press": "Hammer Strength MTS Iso-Lateral Incline Press",
  "hammer-mts-shoulder-chest": "Hammer Strength MTS Shoulder/Chest Press",
  "panatta-supine-press": "Panatta Supine Press (plate-loaded)",
  "panatta-lower-chest-flight": "Panatta Super Lower Chest Flight (plate-loaded)",
  "panatta-inspiration-pec-deck": "Panatta Inspiration Pec Deck",
  "matrix-incline-bench": "Matrix Incline Bench (barbell rack)",
  "matrix-flat-bench": "Matrix Flat Bench Press (barbell rack)",
  "stark-strong-decline-bench": "Stark Strong Decline Bench (barbell rack)",
  "panatta-converging-chest-press": "Panatta Converging Chest Press (plate-loaded)",
  "matrix-adjustable-bench": "Matrix Adjustable Bench",

  // ─── COSTAS ───
  "panatta-super-low-row": "Panatta Super Low Row (plate-loaded)",
  "panatta-monolith-seated-row": "Panatta Monolith Seated Row (cabo)",
  "nautilus-impact-lat-pulldown": "Nautilus Impact Lat Pull Down (cabo)",
  "hoist-rocit-lat-pulldown": "Hoist ROC-IT Lat Pulldown (plate-loaded)",
  "panatta-lat-pulldown": "Panatta Lat Pulldown (plate-loaded)",
  "hammer-gravitron": "Hammer Strength Pulldown/Assisted Chin-Dip",
  "hammer-iso-high-row": "Hammer Strength Iso-Lateral High Row",

  // ─── OMBROS ───
  "hammer-mts-shoulder-press": "Hammer Strength MTS Shoulder Press (cabos duplos)",
  "hammer-plate-shoulder-press": "Hammer Strength Plate-Loaded Shoulder Press",
  "panatta-monolith-shoulder-press": "Panatta Monolith Shoulder Press (cabo)",

  // ─── PERNAS ───
  "matrix-leg-extension": "Matrix Seated Leg Extension (cabo)",
  "hoist-rocit-prone-leg-curl": "Hoist ROC-IT Prone Leg Curl (cabo)",
  "matrix-prone-leg-curl": "Matrix Prone Leg Curl (cabo)",
  "hammer-kneeling-leg-curl": "Hammer Strength Kneeling Leg Curl (plate-loaded)",
  "hammer-standing-leg-curl": "Hammer Strength Standing Leg Curl (plate-loaded)",
  "nautilus-seated-leg-curl": "Nautilus Seated Leg Curl",
  "life-fitness-linear-leg-press": "Life Fitness Linear Leg Press (plate-loaded)",
  "hoist-leg-press-45": "Hoist Leg Press 45° (plate-loaded)",
  "panatta-leg-press-45": "Panatta Leg Press 45° (plate-loaded)",
  "nautilus-leg-press-45": "Nautilus Leg Press 45°",
  "panatta-monolith-hip-thrust": "Panatta Monolith Hip Thrust (cabo)",
  "panatta-hack-squat": "Panatta Hack Squat (plate-loaded)",
  "stark-strong-hack-squat": "Stark Strong Hack Squat",
  "panatta-standing-calf-raise": "Panatta Standing Calf Raise (plataforma)",
  "hoist-rocit-calf-raise": "Hoist ROC-IT Calf Raise (plate-loaded)",
  "panatta-v-squat": "Panatta V-Squat / Power Squat",
  "matrix-hip-abduction": "Matrix Hip Abduction/Adduction (cabo)",
  "panatta-knee-raise": "Panatta Vertical Knee Raise / Captain's Chair",

  // ─── BRAÇOS ───
  "life-fitness-biceps-curl": "Life Fitness Biceps Curl (cabo)",
  "panatta-monolith-arm-curl": "Panatta Monolith Alternate Arm Curl (cabo)",
  "panatta-cable-crossover": "Panatta Big Multi Flight / Cable Crossover",
}

function main() {
  // Criar pasta de input se não existir
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true })
    console.log(`\n  Pasta criada: scripts/glb-input/`)
    console.log(`  Coloque seus arquivos .glb la e rode novamente!\n`)
    console.log(`  Nomes aceitos:`)
    Object.keys(MACHINE_NAMES).forEach(slug => {
      console.log(`    ${slug}.glb  ->  ${MACHINE_NAMES[slug]}`)
    })
    console.log(`\n  Ou use qualquer nome - sera copiado sem mapeamento.\n`)
    return
  }

  // Criar pasta de output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Ler arquivos .glb
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith(".glb"))
  if (files.length === 0) {
    console.log("\n  Nenhum arquivo .glb encontrado em scripts/glb-input/")
    console.log("  Coloque os modelos la e rode novamente.\n")
    return
  }

  console.log(`\n  Encontrados ${files.length} modelos .glb\n`)

  // Carregar index existente ou criar novo
  let index = {}
  if (fs.existsSync(INDEX_FILE)) {
    try { index = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8")) } catch { index = {} }
  }

  // Checar se gltf-transform esta disponível
  let hasGltfTransform = false
  if (!SKIP_OPTIMIZE) {
    try {
      execFileSync("npx", ["@gltf-transform/cli", "--version"], { stdio: "pipe" })
      hasGltfTransform = true
    } catch {
      console.log("  @gltf-transform/cli nao encontrado, copiando sem otimizar.")
      console.log("  Para otimizar: npm install -g @gltf-transform/cli\n")
    }
  }

  let processed = 0
  for (const file of files) {
    const slug = path.basename(file, ".glb")
    const inputPath = path.join(INPUT_DIR, file)
    const outputPath = path.join(OUTPUT_DIR, file)
    const sizeBefore = (fs.statSync(inputPath).size / 1024 / 1024).toFixed(2)

    if (hasGltfTransform && !SKIP_OPTIMIZE) {
      try {
        console.log(`  Otimizando: ${file} (${sizeBefore}MB)...`)
        execFileSync("npx", [
          "@gltf-transform/cli", "optimize",
          inputPath, outputPath,
          "--compress", "draco",
          "--texture-compress", "webp",
        ], { stdio: "pipe" })
        const sizeAfter = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
        console.log(`    + ${sizeBefore}MB -> ${sizeAfter}MB (${Math.round((1 - sizeAfter / sizeBefore) * 100)}% menor)`)
      } catch {
        console.log(`    ! Otimizacao falhou, copiando original...`)
        fs.copyFileSync(inputPath, outputPath)
      }
    } else {
      console.log(`  Copiando: ${file} (${sizeBefore}MB)`)
      fs.copyFileSync(inputPath, outputPath)
    }

    // Atualizar index
    const machineName = MACHINE_NAMES[slug] || slug
    index[slug] = {
      file: `/models/machines/${file}`,
      name: machineName,
      addedAt: new Date().toISOString().slice(0, 10),
    }

    processed++
  }

  // Salvar index
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))

  console.log(`\n  ====================================`)
  console.log(`  Processados: ${processed} modelos`)
  console.log(`  Output: public/models/machines/`)
  console.log(`  Index: public/models/machines/index.json`)
  console.log(`  ====================================\n`)

  // Listar máquinas que ainda não têm modelo
  const existingSlugs = new Set(Object.keys(index))
  const missing = Object.entries(MACHINE_NAMES).filter(([slug]) => !existingSlugs.has(slug))
  if (missing.length > 0) {
    console.log(`  Maquinas sem modelo 3D (${missing.length}):`)
    missing.forEach(([slug, name]) => {
      console.log(`    - ${slug}.glb  ->  ${name}`)
    })
    console.log()
  }
}

main()
