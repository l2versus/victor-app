const pg = require("pg")
const https = require("https")

const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => resolve(JSON.parse(data)))
    }).on("error", reject)
  })
}

// Fuzzy name matching - normalize for comparison
function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[áàã]/g, "a").replace(/[éê]/g, "e").replace(/[íî]/g, "i")
    .replace(/[óô]/g, "o").replace(/[úû]/g, "u").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim()
}

// Map our PT-BR names back to English for matching
const ptToEn = {
  "supino reto com barra": "barbell bench press flat",
  "supino inclinado com barra": "barbell incline bench press",
  "supino declinado com barra": "decline barbell bench press",
  "supino reto com halter": "dumbbell bench press",
  "supino inclinado com halter": "incline dumbbell press",
  "crucifixo com halter": "dumbbell flyes",
  "crossover no cabo": "cable crossover",
  "peck deck": "butterfly",
  "flexao de braco": "push-ups",
  "puxada aberta": "wide-grip lat pulldown",
  "puxada fechada": "close-grip lat pulldown",
  "remada sentada no cabo": "seated cable rows",
  "remada curvada com barra": "bent over barbell row",
  "remada unilateral com halter": "one-arm dumbbell row",
  "remada cavalinho": "t-bar row",
  "face pull no cabo": "face pull",
  "barra fixa pronada": "pullups",
  "barra fixa supinada": "chin-up",
  "desenvolvimento com barra": "barbell shoulder press",
  "desenvolvimento com halter": "dumbbell shoulder press",
  "elevacao lateral com halter": "side lateral raise",
  "elevacao lateral no cabo": "cable lateral raise",
  "elevacao frontal": "front dumbbell raise",
  "crucifixo inverso com halter": "reverse flyes",
  "remada alta": "upright barbell row",
  "encolhimento com barra": "barbell shrug",
  "rosca direta com barra": "barbell curl",
  "rosca com barra w": "ez-bar curl",
  "rosca direta com halter": "dumbbell bicep curl",
  "rosca martelo": "hammer curls",
  "rosca scott": "preacher curl",
  "rosca concentrada": "concentration curls",
  "rosca inclinada": "incline dumbbell curl",
  "triceps pushdown barra": "triceps pushdown",
  "triceps corda": "reverse grip triceps pushdown",
  "triceps testa com barra w": "ez-bar skullcrusher",
  "triceps frances com halter": "dumbbell tricep extension",
  "paralela triceps": "dips - triceps version",
  "supino fechado": "close-grip barbell bench press",
  "agachamento livre": "barbell full squat",
  "agachamento frontal": "front barbell squat",
  "leg press": "leg press",
  "hack squat": "hack squat",
  "cadeira extensora": "leg extensions",
  "avanco caminhando": "dumbbell lunges",
  "agachamento bulgaro": "single leg squat",
  "stiff romeno": "romanian deadlift",
  "mesa flexora": "lying leg curls",
  "cadeira flexora": "seated leg curl",
  "hip thrust com barra": "barbell hip thrust",
  "elevacao de quadril": "barbell glute bridge",
  "agachamento sumo": "sumo squat",
  "abdutora": "thigh abductor",
  "panturrilha em pe": "standing calf raises",
  "panturrilha sentado": "seated calf raise",
  "prancha": "plank",
  "abdominal crunch": "crunches",
  "elevacao de pernas na barra": "hanging leg raise",
  "twist russo": "russian twist",
  "roda abdominal": "ab roller",
  "levantamento terra": "barbell deadlift",
  "terra sumo": "sumo deadlift",
  "burpee": "burpee",
  "corrida na esteira": "jogging-treadmill",
  "bicicleta ergometrica": "bicycle",
  "pular corda": "rope jumping",
}

async function main() {
  console.log("Fetching exercise database...")
  const dbExercises = await fetchJSON(
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
  )
  console.log(`Got ${dbExercises.length} exercises from free-exercise-db`)

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  const ourExercises = await client.query('SELECT id, name FROM "Exercise" WHERE "gifUrl" IS NULL')
  console.log(`Our exercises without images: ${ourExercises.rows.length}`)

  // Build search index from free-exercise-db
  const searchIndex = dbExercises.map((ex) => ({
    id: ex.id,
    name: normalize(ex.name),
    images: ex.images,
  }))

  let matched = 0
  let unmatched = []

  for (const our of ourExercises.rows) {
    const ourNorm = normalize(our.name)

    // Try direct match first
    let match = searchIndex.find((s) => s.name === ourNorm)

    // Try PT-BR to EN mapping
    if (!match && ptToEn[ourNorm]) {
      const enNorm = normalize(ptToEn[ourNorm])
      match = searchIndex.find((s) => s.name.includes(enNorm) || enNorm.includes(s.name))
    }

    // Try fuzzy: check if key words overlap
    if (!match) {
      const ourWords = ourNorm.split(" ").filter((w) => w.length > 3)
      let bestScore = 0
      let bestMatch = null
      for (const s of searchIndex) {
        const sWords = s.name.split(" ").filter((w) => w.length > 3)
        const overlap = ourWords.filter((w) => sWords.some((sw) => sw.includes(w) || w.includes(sw))).length
        const score = overlap / Math.max(ourWords.length, 1)
        if (score > bestScore && score >= 0.5) {
          bestScore = score
          bestMatch = s
        }
      }
      match = bestMatch
    }

    if (match && match.images && match.images.length > 0) {
      const gifUrl = `${IMG_BASE}/${match.images[0]}`
      await client.query('UPDATE "Exercise" SET "gifUrl" = $1 WHERE id = $2', [gifUrl, our.id])
      matched++
    } else {
      unmatched.push(our.name)
    }
  }

  console.log(`\nMatched: ${matched}/${ourExercises.rows.length}`)
  if (unmatched.length > 0) {
    console.log(`\nUnmatched (${unmatched.length}):`)
    unmatched.forEach((n) => console.log(`  - ${n}`))
  }

  await client.end()
}

main().catch((e) => console.error(e.message))
