const pg = require("pg")

async function translate() {
  const client = new pg.Client({
    host: "187.77.226.144", port: 5433, user: "postgres",
    password: "GxrbBZwZliStmYTi58BVifHPm4W3lPXK4ZuPZZBIvUZxBSoo96i41yr0ijEki07U",
    database: "postgres",
  })
  await client.connect()

  // Grupos musculares
  const muscles = [
    ["Chest", "Peito"], ["Back", "Costas"], ["Shoulders", "Ombros"],
    ["Biceps", "Bíceps"], ["Triceps", "Tríceps"], ["Quadriceps", "Quadríceps"],
    ["Hamstrings", "Posterior"], ["Glutes", "Glúteos"], ["Calves", "Panturrilha"],
    ["Core", "Abdômen"], ["Traps", "Trapézio"], ["Forearms", "Antebraço"],
    ["Full Body", "Corpo Inteiro"], ["Cardio", "Cardio"], ["Stretching", "Alongamento"],
  ]
  for (const [en, pt] of muscles) {
    const r = await client.query('UPDATE "Exercise" SET muscle = $1 WHERE muscle = $2', [pt, en])
    if (r.rowCount > 0) console.log(`${en} → ${pt}: ${r.rowCount}`)
  }

  // Equipamentos
  const equips = [
    ["Barbell", "Barra"], ["Dumbbell", "Halter"], ["Cable", "Cabo"],
    ["Machine", "Máquina"], ["Bodyweight", "Peso Corporal"],
    ["Kettlebell", "Kettlebell"], ["Band", "Elástico"], ["Other", "Outro"],
  ]
  for (const [en, pt] of equips) {
    const r = await client.query('UPDATE "Exercise" SET equipment = $1 WHERE equipment = $2', [pt, en])
    if (r.rowCount > 0) console.log(`${en} → ${pt}: ${r.rowCount}`)
  }

  // Nomes
  const names = [
    ["Flat Barbell Bench Press", "Supino Reto com Barra"],
    ["Incline Barbell Bench Press", "Supino Inclinado com Barra"],
    ["Decline Barbell Bench Press", "Supino Declinado com Barra"],
    ["Flat Dumbbell Bench Press", "Supino Reto com Halter"],
    ["Incline Dumbbell Bench Press", "Supino Inclinado com Halter"],
    ["Decline Dumbbell Bench Press", "Supino Declinado com Halter"],
    ["Dumbbell Fly", "Crucifixo com Halter"],
    ["Incline Dumbbell Fly", "Crucifixo Inclinado"],
    ["Decline Dumbbell Fly", "Crucifixo Declinado"],
    ["Cable Crossover", "Crossover no Cabo"],
    ["Low Cable Crossover", "Crossover Baixo"],
    ["Machine Chest Press", "Supino na Máquina"],
    ["Pec Deck Fly", "Peck Deck"],
    ["Push-Up", "Flexão de Braço"],
    ["Incline Push-Up", "Flexão Inclinada"],
    ["Deficit Push-Up", "Flexão com Déficit"],
    ["Diamond Push-Up", "Flexão Diamante"],
    ["Dip (Chest)", "Paralela (Peito)"],
    ["Cable Chest Press", "Supino no Cabo"],
    ["Floor Press", "Supino no Chão (Barra)"],
    ["Dumbbell Floor Press", "Supino no Chão (Halter)"],
    ["Wide-Grip Lat Pulldown", "Puxada Aberta"],
    ["Close-Grip Lat Pulldown", "Puxada Fechada"],
    ["Reverse-Grip Lat Pulldown", "Puxada Supinada"],
    ["Seated Cable Row", "Remada Sentada no Cabo"],
    ["Barbell Bent-Over Row", "Remada Curvada com Barra"],
    ["Dumbbell Single-Arm Row", "Remada Unilateral com Halter"],
    ["T-Bar Row", "Remada Cavalinho"],
    ["Machine Row", "Remada na Máquina"],
    ["Cable Face Pull", "Face Pull no Cabo"],
    ["Pull-Up", "Barra Fixa (Pronada)"],
    ["Chin-Up", "Barra Fixa (Supinada)"],
    ["Neutral-Grip Pull-Up", "Barra Fixa (Neutra)"],
    ["Inverted Row", "Remada Invertida"],
    ["Straight-Arm Pulldown", "Pulldown Braço Reto"],
    ["Chest-Supported Row", "Remada com Apoio no Peito"],
    ["Barbell Overhead Press", "Desenvolvimento com Barra"],
    ["Dumbbell Shoulder Press", "Desenvolvimento com Halter"],
    ["Machine Shoulder Press", "Desenvolvimento na Máquina"],
    ["Dumbbell Lateral Raise", "Elevação Lateral com Halter"],
    ["Cable Lateral Raise", "Elevação Lateral no Cabo"],
    ["Seated Dumbbell Lateral Raise", "Elevação Lateral Sentado"],
    ["Machine Lateral Raise", "Elevação Lateral na Máquina"],
    ["Dumbbell Front Raise", "Elevação Frontal"],
    ["Dumbbell Rear Delt Fly", "Crucifixo Inverso com Halter"],
    ["Cable Rear Delt Fly", "Crucifixo Inverso no Cabo"],
    ["Reverse Pec Deck", "Peck Deck Inverso"],
    ["Upright Row", "Remada Alta"],
    ["Barbell Shrug", "Encolhimento com Barra"],
    ["Dumbbell Shrug", "Encolhimento com Halter"],
    ["Plate Front Raise", "Elevação Frontal com Anilha"],
    ["Behind-the-Neck Press", "Desenvolvimento Atrás da Nuca"],
    ["Barbell Curl", "Rosca Direta com Barra"],
    ["EZ-Bar Curl", "Rosca com Barra W"],
    ["Dumbbell Curl", "Rosca Direta com Halter"],
    ["Hammer Curl", "Rosca Martelo"],
    ["Preacher Curl", "Rosca Scott"],
    ["Concentration Curl", "Rosca Concentrada"],
    ["Cable Curl", "Rosca no Cabo"],
    ["Incline Dumbbell Curl", "Rosca Inclinada"],
    ["Spider Curl", "Rosca Spider"],
    ["Cross-Body Hammer Curl", "Rosca Martelo Cross-Body"],
    ["Cable Rope Hammer Curl", "Rosca Martelo no Cabo (Corda)"],
    ["Zottman Curl", "Rosca Zottman"],
    ["Cable Tricep Pushdown", "Tríceps Pushdown (Barra)"],
    ["Rope Tricep Pushdown", "Tríceps Corda"],
    ["Overhead Cable Extension", "Tríceps Testa no Cabo"],
    ["Dumbbell Overhead Extension", "Tríceps Francês com Halter"],
    ["EZ-Bar Skull Crusher", "Tríceps Testa com Barra W"],
    ["Dumbbell Skull Crusher", "Tríceps Testa com Halter"],
    ["Tricep Dip", "Paralela (Tríceps)"],
    ["Close-Grip Bench Press", "Supino Fechado"],
    ["Tricep Kickback", "Tríceps Coice"],
    ["Bench Dip", "Mergulho no Banco"],
    ["Single-Arm Cable Pushdown", "Tríceps Unilateral no Cabo"],
    ["Overhead Rope Extension", "Tríceps Testa com Corda"],
    ["Barbell Back Squat", "Agachamento Livre"],
    ["Barbell Front Squat", "Agachamento Frontal"],
    ["Goblet Squat", "Agachamento Goblet"],
    ["Kettlebell Goblet Squat", "Agachamento Goblet (Kettlebell)"],
    ["Leg Press (Narrow Stance)", "Leg Press (Pés Juntos)"],
    ["Smith Machine Squat", "Agachamento no Smith"],
    ["Leg Extension", "Cadeira Extensora"],
    ["Walking Lunge", "Avanço Caminhando"],
    ["Reverse Lunge", "Avanço Reverso"],
    ["Bulgarian Split Squat", "Agachamento Búlgaro"],
    ["Step-Up", "Step-Up com Halter"],
    ["Barbell Lunge", "Avanço com Barra"],
    ["Lateral Lunge", "Avanço Lateral"],
    ["Romanian Deadlift", "Stiff (Romeno)"],
    ["Stiff-Leg Deadlift", "Stiff com Pernas Retas"],
    ["Lying Leg Curl", "Mesa Flexora"],
    ["Seated Leg Curl", "Cadeira Flexora"],
    ["Standing Leg Curl", "Flexora em Pé"],
    ["Single-Leg Romanian Deadlift", "Stiff Unilateral"],
    ["Dumbbell Romanian Deadlift", "Stiff com Halter"],
    ["Barbell Hip Thrust", "Hip Thrust com Barra"],
    ["Glute Bridge", "Elevação de Quadril"],
    ["Cable Kickback", "Glúteo no Cabo"],
    ["Cable Pull-Through", "Pull-Through no Cabo"],
    ["Sumo Squat", "Agachamento Sumô"],
    ["Hip Abduction Machine", "Abdutora"],
    ["Banded Lateral Walk", "Caminhada Lateral com Elástico"],
    ["Single-Leg Hip Thrust", "Hip Thrust Unilateral"],
    ["Smith Machine Hip Thrust", "Hip Thrust no Smith"],
    ["Banded Glute Bridge", "Elevação de Quadril com Elástico"],
    ["Standing Calf Raise", "Panturrilha em Pé"],
    ["Seated Calf Raise", "Panturrilha Sentado"],
    ["Donkey Calf Raise", "Panturrilha Donkey"],
    ["Leg Press Calf Raise", "Panturrilha no Leg Press"],
    ["Single-Leg Calf Raise", "Panturrilha Unilateral"],
    ["Smith Machine Calf Raise", "Panturrilha no Smith"],
    ["Plank", "Prancha"],
    ["Side Plank", "Prancha Lateral"],
    ["Ab Crunch", "Abdominal Crunch"],
    ["Bicycle Crunch", "Abdominal Bicicleta"],
    ["Hanging Leg Raise", "Elevação de Pernas na Barra"],
    ["Lying Leg Raise", "Elevação de Pernas Deitado"],
    ["Russian Twist", "Twist Russo"],
    ["Cable Woodchop", "Woodchop no Cabo"],
    ["Ab Wheel Rollout", "Roda Abdominal"],
    ["Decline Sit-Up", "Abdominal Declinado"],
    ["Hanging Knee Raise", "Elevação de Joelhos na Barra"],
    ["Cable Crunch", "Abdominal no Cabo"],
    ["Trap Bar Shrug", "Encolhimento no Trap Bar"],
    ["Barbell Wrist Curl", "Rosca de Punho"],
    ["Reverse Wrist Curl", "Rosca de Punho Inversa"],
    ["Reverse Barbell Curl", "Rosca Inversa"],
    ["Dead Hang", "Suspensão na Barra"],
    ["Conventional Deadlift", "Levantamento Terra"],
    ["Sumo Deadlift", "Terra Sumô"],
    ["Trap Bar Deadlift", "Terra no Trap Bar"],
    ["Treadmill Run", "Corrida na Esteira"],
    ["Treadmill Walk (Incline)", "Caminhada Inclinada"],
    ["Stationary Bike", "Bicicleta Ergométrica"],
    ["Rowing Machine", "Remo Ergométrico"],
    ["Elliptical", "Elíptico"],
    ["Jump Rope", "Pular Corda"],
    ["Stair Climber", "Escada (StairMaster)"],
    ["Hip Flexor Stretch", "Alongamento de Flexor do Quadril"],
    ["Hamstring Stretch", "Alongamento de Posterior"],
    ["Chest Doorway Stretch", "Alongamento de Peito"],
    ["Lat Stretch", "Alongamento de Dorsal"],
    ["Quad Stretch", "Alongamento de Quadríceps"],
    ["Calf Stretch", "Alongamento de Panturrilha"],
    ["Cat-Cow Stretch", "Gato e Vaca"],
    ["Foam Roll (IT Band)", "Rolo de Espuma (IT Band)"],
    ["Foam Roll (Upper Back)", "Rolo de Espuma (Costas)"],
    ["Shoulder Dislocate", "Deslocamento de Ombro (Bastão)"],
    ["Banded Shoulder Stretch", "Alongamento de Ombro com Elástico"],
  ]

  let translated = 0
  for (const [en, pt] of names) {
    const r = await client.query('UPDATE "Exercise" SET name = $1 WHERE name = $2', [pt, en])
    if (r.rowCount > 0) translated++
  }
  console.log("Nomes traduzidos:", translated)

  const total = await client.query('SELECT COUNT(*) FROM "Exercise"')
  console.log("Total exercícios:", total.rows[0].count)

  // Mostrar amostra
  const sample = await client.query('SELECT name, muscle, equipment FROM "Exercise" ORDER BY muscle, name LIMIT 15')
  console.log("\nAmostra:")
  sample.rows.forEach(r => console.log(`  ${r.muscle} | ${r.name} | ${r.equipment}`))

  await client.end()
}

translate().catch(e => console.error(e.message))
