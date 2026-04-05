/**
 * GymVision Dataset Builder
 *
 * Reads the Panatta seed data and organizes photos into machine classes
 * for training the TF.js MobileNetV3 classifier.
 *
 * Run: npx tsx scripts/gymvision-dataset.ts
 *
 * Output: public/models/gymvision/dataset.json
 */

import * as fs from "fs"
import * as path from "path"

// ─── Machine class mapping ─────────────────────────────────────────────────

interface ClassMapping {
  classId: string
  className: string
  classNamePt: string
  keywords: string[]
  muscleMatch: string[]
}

const CLASS_MAPPINGS: ClassMapping[] = [
  { classId: "leg_press", className: "Leg Press", classNamePt: "Leg Press", keywords: ["leg press", "horizontal leg", "leg press bridge"], muscleMatch: [] },
  { classId: "hack_squat", className: "Hack Squat", classNamePt: "Hack Squat", keywords: ["hack squat", "hack machine", "belt squat", "pendulum squat", "power squat", "squat machine", "sissy squat", "power runner"], muscleMatch: [] },
  { classId: "leg_extension", className: "Leg Extension", classNamePt: "Cadeira Extensora", keywords: ["leg extension", "extensora"], muscleMatch: [] },
  { classId: "leg_curl", className: "Leg Curl", classNamePt: "Mesa Flexora", keywords: ["leg curl", "flexora", "hamstring curl"], muscleMatch: [] },
  { classId: "abductor_adductor", className: "Abductor / Adductor", classNamePt: "Abdutora / Adutora", keywords: ["abductor", "adductor"], muscleMatch: [] },
  { classId: "chest_press", className: "Chest Press", classNamePt: "Supino Máquina", keywords: ["chest press", "multi press", "smith dual system upper", "bench press", "dips press", "multipurpose press"], muscleMatch: [] },
  { classId: "pec_deck", className: "Pec Deck / Fly", classNamePt: "Pec Deck", keywords: ["pec deck", "fly", "pectoral", "chest fly", "peck back", "flight", "chest flight"], muscleMatch: [] },
  { classId: "lat_pulldown", className: "Lat Pulldown", classNamePt: "Puxada Frontal", keywords: ["lat pull", "dorsy bar", "front dorsy", "pulldown", "pullover", "chin and dip"], muscleMatch: [] },
  { classId: "seated_row", className: "Seated Row", classNamePt: "Remada", keywords: ["row", "remada", "high row", "low row", "t-bar", "seal row", "shrug"], muscleMatch: [] },
  { classId: "shoulder_press", className: "Shoulder Press", classNamePt: "Desenvolvimento", keywords: ["shoulder press", "deltoid press", "overhead press", "rotary cuff", "standing multi flight"], muscleMatch: [] },
  { classId: "lateral_raise", className: "Lateral Raise", classNamePt: "Elevação Lateral", keywords: ["lateral deltoid", "lateral raise"], muscleMatch: [] },
  { classId: "rear_delt", className: "Rear Delt", classNamePt: "Deltoide Posterior", keywords: ["back deltoid", "rear delt"], muscleMatch: [] },
  { classId: "bicep_curl_machine", className: "Bicep Curl Machine", classNamePt: "Rosca Bíceps Máquina", keywords: ["curl", "bicep", "preacher", "curling"], muscleMatch: ["Biceps"] },
  { classId: "tricep_machine", className: "Tricep Machine", classNamePt: "Tríceps Máquina", keywords: ["tricep", "french press"], muscleMatch: ["Triceps"] },
  { classId: "ab_machine", className: "Ab / Core Machine", classNamePt: "Abdominal Máquina", keywords: ["core", "crunch", "abdominal", "back extension", "lower back"], muscleMatch: ["Abs", "Lower Back"] },
  { classId: "glute_machine", className: "Glute Machine", classNamePt: "Glúteo Máquina", keywords: ["glute", "hip thrust"], muscleMatch: ["Glutes"] },
  { classId: "calf_raise", className: "Calf Raise", classNamePt: "Panturrilha", keywords: ["calf", "panturrilha"], muscleMatch: ["Calves"] },
  { classId: "bench_rack", className: "Bench / Rack", classNamePt: "Banco / Rack", keywords: ["bench", "rack", "squat rack"], muscleMatch: [] },
  { classId: "cable_machine", className: "Cable Machine", classNamePt: "Cabos", keywords: ["cable", "pulley", "functional trainer", "crossover", "4-station", "jungle machine", "multi gym"], muscleMatch: ["Full Body"] },
  { classId: "smith_machine", className: "Smith Machine", classNamePt: "Smith Machine", keywords: ["smith machine"], muscleMatch: [] },
]

// ─── Parse seed file ───────────────────────────────────────────────────────

interface SeedMachine {
  name: string
  muscle: string
  imageUrl: string | null
  machineCode: string
}

function parseSeedFile(filePath: string): SeedMachine[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const machines: SeedMachine[] = []
  const entryRegex = /\{\s*name:\s*"([^"]+)"[\s\S]*?muscle:\s*"([^"]+)"[\s\S]*?imageUrl:\s*("([^"]+)"|null)[\s\S]*?machineCode:\s*"([^"]+)"/g
  let match
  while ((match = entryRegex.exec(content)) !== null) {
    machines.push({ name: match[1], muscle: match[2], imageUrl: match[4] || null, machineCode: match[5] })
  }
  return machines
}

function classifyMachine(machine: SeedMachine): string {
  const nameLower = machine.name.toLowerCase()
  for (const cls of CLASS_MAPPINGS) {
    if (cls.keywords.some(kw => nameLower.includes(kw))) return cls.classId
    if (cls.muscleMatch.includes(machine.muscle)) return cls.classId
  }
  return "unknown"
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const seedPath = path.join(__dirname, "..", "prisma", "seed-panatta.ts")
  const outputDir = path.join(__dirname, "..", "public", "models", "gymvision")

  console.log("GymVision Dataset Builder")
  console.log("-".repeat(50))

  const machines = parseSeedFile(seedPath)
  console.log(`Parsed ${machines.length} machines from seed`)

  const dataset: Record<string, { className: string; classNamePt: string; images: string[]; count: number }> = {}
  let unknownCount = 0

  for (const m of machines) {
    const classId = classifyMachine(m)
    if (classId === "unknown") {
      unknownCount++
      console.log(`  Unknown: "${m.name}" (muscle: ${m.muscle})`)
      continue
    }
    if (!dataset[classId]) {
      const cls = CLASS_MAPPINGS.find(c => c.classId === classId)!
      dataset[classId] = { className: cls.className, classNamePt: cls.classNamePt, images: [], count: 0 }
    }
    if (m.imageUrl) {
      const imgPath = path.join(__dirname, "..", "public", m.imageUrl)
      if (fs.existsSync(imgPath)) {
        dataset[classId].images.push(m.imageUrl)
        dataset[classId].count++
      }
    }
  }

  // Summary
  console.log("\nDataset Summary:")
  console.log("-".repeat(50))
  let totalImages = 0
  const classes = Object.entries(dataset).sort((a, b) => b[1].count - a[1].count)
  for (const [classId, data] of classes) {
    console.log(`  ${data.classNamePt.padEnd(30)} ${String(data.count).padStart(3)} images  (${classId})`)
    totalImages += data.count
  }
  console.log("-".repeat(50))
  console.log(`  TOTAL: ${totalImages} images in ${classes.length} classes`)
  console.log(`  Unknown: ${unknownCount} machines`)

  // Save manifest
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const manifest = {
    version: "1.0.0",
    created: new Date().toISOString(),
    totalImages,
    totalClasses: classes.length,
    source: "Panatta seed (146 machines)",
    classes: Object.fromEntries(
      classes.map(([classId, data]) => [classId, {
        name: data.className,
        namePt: data.classNamePt,
        imageCount: data.count,
        images: data.images,
      }])
    ),
  }

  const manifestPath = path.join(outputDir, "dataset.json")
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\nDataset manifest saved to: ${manifestPath}`)
}

main()
