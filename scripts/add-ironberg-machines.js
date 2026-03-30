const pg = require("pg")

async function addMachines() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()

  // Get the trainer ID (first trainer)
  const trainerRes = await client.query('SELECT id FROM "TrainerProfile" LIMIT 1')
  if (!trainerRes.rows.length) { console.error("No trainer found"); return }

  const machines = [
    // ═══ HAMMER STRENGTH (vermelho, plate-loaded) ═══
    { name: "Hammer Strength Pendulum Squat", nameEn: "Hammer Strength Pendulum Squat", muscle: "Quadríceps", equipment: "Máquina", instructions: "Posicione os ombros nos apoios, pés na plataforma na largura dos ombros. Agache controlando a descida e empurre com força na subida. A trajetória pendular reduz impacto nos joelhos." },
    { name: "Hammer Strength V-Squat", nameEn: "Hammer Strength V-Squat", muscle: "Quadríceps", equipment: "Máquina", instructions: "Apoie os ombros, pés na plataforma. Agache profundo mantendo as costas no encosto. O ângulo V isola mais os quadríceps." },
    { name: "Hammer Strength Super Fly", nameEn: "Hammer Strength Super Fly", muscle: "Peito", equipment: "Máquina", instructions: "Sente-se com as costas no encosto. Segure as alavancas e faça o movimento de abraço, apertando o peito no centro. Controle a fase excêntrica." },
    { name: "Hammer Strength Belt Squat", nameEn: "Hammer Strength Belt Squat", muscle: "Quadríceps", equipment: "Máquina", instructions: "Prenda o cinto na cintura, pés na plataforma elevada. Agache sem sobrecarregar a coluna — todo o peso fica na cintura, não nos ombros." },
    { name: "Hammer Strength D.Y. Row", nameEn: "Hammer Strength D.Y. Row", muscle: "Costas", equipment: "Máquina", instructions: "Apoie o peito no pad, segure as alavancas. Puxe os cotovelos para trás e para baixo, apertando as escápulas. Modelo inspirado no Dorian Yates." },
    { name: "Hammer Strength Iso-Lateral Leg Extension", nameEn: "Hammer Strength Iso-Lateral Leg Extension", muscle: "Quadríceps", equipment: "Máquina", instructions: "Sente-se com as costas no encosto, joelhos alinhados com o eixo da máquina. Estenda uma perna de cada vez para corrigir desequilíbrios. Controle a descida." },
    { name: "Hammer Strength Iso-Lateral Leg Curl", nameEn: "Hammer Strength Iso-Lateral Leg Curl", muscle: "Posterior", equipment: "Máquina", instructions: "Deite com o quadril nos apoios, joelhos alinhados com o eixo. Flexione uma perna de cada vez para isolar cada posterior. Segure na contração máxima." },
    { name: "Hammer Strength Ground Base Multi-Squat", nameEn: "Hammer Strength Ground Base Squat/Lunge", muscle: "Quadríceps", equipment: "Máquina", instructions: "Use os apoios de ombro, posicione os pés no chão. Permite agachamento e avanço com trajetória livre. Mantenha o core ativado." },
    { name: "Hammer Strength Calf Raise", nameEn: "Hammer Strength Standing Calf Raise", muscle: "Panturrilha", equipment: "Máquina", instructions: "Apoie os ombros, pontas dos pés na plataforma. Suba até a contração máxima, segure 2s, desça com calcanhar abaixo da plataforma para alongar." },
    { name: "Hammer Strength Decline Press", nameEn: "Hammer Strength Iso-Lateral Decline Press", muscle: "Peito", equipment: "Máquina", instructions: "Costas no encosto declinado. Empurre as alavancas para frente apertando a parte inferior do peito. Movimento iso-lateral corrige desequilíbrios." },

    // ═══ HOIST ROC-IT (preto com detalhes amarelos) ═══
    { name: "Hoist Chest Press (ROC-IT)", nameEn: "Hoist ROC-IT RS-2301 Chest Press", muscle: "Peito", equipment: "Máquina", instructions: "Sente-se com as costas no encosto. A tecnologia ROC-IT ajusta automaticamente sua posição durante o movimento, garantindo biomecânica perfeita. Empurre e controle." },
    { name: "Hoist Pec Fly (ROC-IT)", nameEn: "Hoist ROC-IT RS-2302 Pec Fly", muscle: "Peito", equipment: "Máquina", instructions: "Costas no encosto, braços abertos. A máquina se adapta ao seu corpo durante o movimento. Aperte no centro controlando." },
    { name: "Hoist Shoulder Press (ROC-IT)", nameEn: "Hoist ROC-IT RS-2501 Shoulder Press", muscle: "Ombros", equipment: "Máquina", instructions: "Sente-se ereto, mãos nas alavancas. Empurre para cima sem travar os cotovelos. O ROC-IT mantém o ombro na posição segura durante todo o ROM." },
    { name: "Hoist Lat Pulldown (ROC-IT)", nameEn: "Hoist ROC-IT RS-1201 Lat Pulldown", muscle: "Costas", equipment: "Máquina", instructions: "Sente-se com as coxas sob os apoios. Puxe a barra até o peito, cotovelos para trás. O sistema ROC-IT otimiza a trajetória para máxima ativação dorsal." },
    { name: "Hoist Biceps Curl (ROC-IT)", nameEn: "Hoist ROC-IT RS-1102 Biceps Curl", muscle: "Bíceps", equipment: "Máquina", instructions: "Apoie os braços no pad, cotovelos alinhados com o eixo. Flexione controlando e aperte no topo. O ROC-IT mantém a posição ideal dos braços." },
    { name: "Hoist Triceps Extension (ROC-IT)", nameEn: "Hoist ROC-IT RS-1103 Triceps Extension", muscle: "Tríceps", equipment: "Máquina", instructions: "Sente-se, apoie os cotovelos no pad. Estenda os braços completamente, apertando o tríceps na extensão total. Controle o retorno." },
    { name: "Hoist Lateral Raise (ROC-IT)", nameEn: "Hoist ROC-IT RS-1502 Lateral Raise", muscle: "Ombros", equipment: "Máquina", instructions: "Sente-se ereto com os braços nas almofadas laterais. Eleve até a altura dos ombros, segure 1s. A máquina guia a trajetória perfeita." },
    { name: "Hoist Seated Dip (ROC-IT)", nameEn: "Hoist ROC-IT RS-2101 Seated Dip", muscle: "Tríceps", equipment: "Máquina", instructions: "Sente-se, mãos nas alavancas ao lado do corpo. Empurre para baixo estendendo os braços. Foco no tríceps sem sobrecarregar ombros." },
    { name: "Hoist Glute Master (ROC-IT)", nameEn: "Hoist ROC-IT RS-2412 Glute Master", muscle: "Glúteos", equipment: "Máquina", instructions: "Apoie a coxa no pad, empurre a perna para trás ativando o glúteo. Segure na contração máxima por 1-2s. Trabalhe cada lado individualmente." },
    { name: "Hoist Abdominal (ROC-IT)", nameEn: "Hoist ROC-IT RS-2601 Abdominals", muscle: "Abdômen", equipment: "Máquina", instructions: "Sente-se com o peito nos apoios, mãos nas alavancas. Flexione o tronco apertando o abdômen. O ROC-IT garante a trajetória segura para a lombar." },

    // ═══ NAUTILUS (cinza/preto) ═══
    { name: "Nautilus Leg Curl (Deitado)", nameEn: "Nautilus Prone Leg Curl", muscle: "Posterior", equipment: "Máquina", instructions: "Deite de bruços, calcanhares sob os rolos. Flexione os joelhos trazendo os calcanhares em direção aos glúteos. A cam Nautilus mantém tensão constante." },
    { name: "Nautilus Chest Press", nameEn: "Nautilus Chest Press", muscle: "Peito", equipment: "Máquina", instructions: "Costas no encosto, pés no chão. Empurre as alavancas para frente sem travar os cotovelos. A convergência do Nautilus imita o arco natural do supino." },
    { name: "Nautilus Abdominal Crunch", nameEn: "Nautilus Abdominal Crunch", muscle: "Abdômen", equipment: "Máquina", instructions: "Sente-se, peito nos apoios. Flexione o tronco controlando, expire no esforço. Não puxe com as mãos — ative o abdômen." },

    // ═══ LIFE FITNESS / CYBEX (complementar) ═══
    { name: "Life Fitness Insignia Chest Press", nameEn: "Life Fitness Insignia Chest Press", muscle: "Peito", equipment: "Máquina", instructions: "Sente-se, ajuste a altura para que as alavancas fiquem na altura do peito. Empurre para frente mantendo os ombros para baixo. Série Insignia com biomecânica premium." },
    { name: "Life Fitness Insignia Lat Pulldown", nameEn: "Life Fitness Insignia Lat Pulldown", muscle: "Costas", equipment: "Máquina", instructions: "Sente-se, coxas sob os apoios. Puxe a barra ao peito liderando com os cotovelos. Série Insignia com trajetória otimizada." },
    { name: "Life Fitness Insignia Shoulder Press", nameEn: "Life Fitness Insignia Shoulder Press", muscle: "Ombros", equipment: "Máquina", instructions: "Sente-se ereto, mãos nas alavancas. Empurre para cima sem arquear as costas. Série Insignia com cames de resistência variável." },
    { name: "Life Fitness Insignia Leg Press", nameEn: "Life Fitness Insignia Leg Press", muscle: "Quadríceps", equipment: "Máquina", instructions: "Costas no encosto, pés na plataforma na largura dos ombros. Desça até 90° nos joelhos e empurre. Não trave os joelhos no topo." },
    { name: "Cybex Prestige VRS Leg Extension", nameEn: "Cybex Prestige VRS Leg Extension", muscle: "Quadríceps", equipment: "Máquina", instructions: "Sente-se, ajuste o encosto e o rolo na canela. Estenda as pernas completamente, aperte no topo. VRS oferece resistência variável ao longo do ROM." },
    { name: "Cybex Prestige VRS Leg Curl", nameEn: "Cybex Prestige VRS Leg Curl", muscle: "Posterior", equipment: "Máquina", instructions: "Deite de bruços, calcanhares sob os rolos. Flexione os joelhos controlando. A resistência variável Cybex mantém tensão ideal em todo o movimento." },

    // ═══ CARDIO (Life Fitness) ═══
    { name: "Life Fitness Activate Esteira", nameEn: "Life Fitness Activate Treadmill", muscle: "Cardio", equipment: "Máquina", instructions: "Suba na esteira, segure nas barras laterais. Comece caminhando e aumente gradualmente. Mantenha postura ereta, olhe para frente." },
    { name: "Life Fitness Integrity Bicicleta", nameEn: "Life Fitness Integrity Bike", muscle: "Cardio", equipment: "Máquina", instructions: "Ajuste o banco na altura correta (perna quase estendida embaixo). Pedale com cadência constante. Mantenha a postura ereta." },
    { name: "ICG Spinning Bike", nameEn: "ICG Indoor Cycling Bike", muscle: "Cardio", equipment: "Máquina", instructions: "Ajuste banco e guidão. Pedale mantendo core ativado. Não balance o tronco — a força vem das pernas." },
  ]

  let added = 0
  for (const m of machines) {
    // Check if exists
    const exists = await client.query('SELECT id FROM "Exercise" WHERE name = $1', [m.name])
    if (exists.rows.length > 0) {
      console.log(`  Já existe: ${m.name}`)
      continue
    }
    await client.query(
      'INSERT INTO "Exercise" (id, name, muscle, equipment, instructions) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
      [m.name, m.muscle, m.equipment, m.instructions]
    )
    added++
    console.log(`  ✓ ${m.name} (${m.muscle})`)
  }

  const total = await client.query('SELECT COUNT(*) FROM "Exercise"')
  console.log(`\nAdicionados: ${added} | Total exercícios: ${total.rows[0].count}`)
  await client.end()
}

addMachines().catch(e => console.error(e.message))
