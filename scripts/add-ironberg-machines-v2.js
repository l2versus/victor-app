const pg = require("pg")

// ══════════════════════════════════════════════════════════════════════════════
// IRONBERG — 52 MÁQUINAS MAPEADAS (março 2026)
// Marcas: Matrix, Hammer Strength, Hammer Strength MTS, Panatta, Panatta Monolith,
//         Panatta Inspiration, Hoist, Hoist ROC-IT, Nautilus, Nautilus Impact,
//         Life Fitness, Stark Strong, Bosu
// ══════════════════════════════════════════════════════════════════════════════

async function addMachines() {
  const client = new pg.Client({
    host: "187.77.226.144", port: 5433, user: "postgres",
    password: "GxrbBZwZliStmYTi58BVifHPm4W3lPXK4ZuPZZBIvUZxBSoo96i41yr0ijEki07U",
    database: "postgres",
  })
  await client.connect()
  console.log("Conectado ao banco!")

  const machines = [
    // ═══ ABDOMINAL / CORE (8 máquinas) ═══
    { name: "Matrix Abdominal Crunch (cabo)", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Matrix",
      instructions: "Sente-se, peito nos apoios. Flexione o tronco controlando, expire no esforço. Botões laranja ajustam a resistência. Não puxe com as mãos — ative o abdômen." },
    { name: "Hammer Strength Seated Ab Crunch", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Hammer Strength",
      instructions: "Sente-se com as costas no encosto, mãos nas alavancas. Flexione o tronco para baixo contraindo o abdômen. Plate-loaded — adicione anilhas conforme progredir." },
    { name: "Nautilus Impact Abdominal (cabo)", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Nautilus Impact",
      instructions: "Sente-se, peito nos apoios. Flexione o tronco controlando. A cam Nautilus mantém tensão constante durante todo o ROM." },
    { name: "Hoist ROC-IT Ab Crunch", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Hoist ROC-IT",
      instructions: "Sente-se com o peito nos apoios. A tecnologia ROC-IT ajusta automaticamente a trajetória para proteger a lombar. Flexione controlando." },
    { name: "Nautilus Inspiration Abdominal (cabo)", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Nautilus Inspiration",
      instructions: "Sente-se, apoie o peito. Flexione o tronco controlando a descida. Série Inspiration com biomecânica premium." },
    { name: "Panatta Monolith Abdominal Crunch (cabo)", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Panatta Monolith",
      instructions: "Sente-se, peito nos apoios. Flexione o tronco apertando o abdômen. Design Monolith italiano com trajetória guiada." },
    { name: "Matrix Rotary Torso", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Matrix",
      instructions: "Sente-se com as coxas travadas. Gire o tronco para um lado controlando, volte devagar. Trabalha oblíquos. Não use impulso — rotação controlada." },

    // ═══ PEITO (12+ máquinas) ═══
    { name: "Hammer Strength MTS Iso-Lateral Chest Press", muscle: "Peito", equipment: "Máquina", machineBrand: "Hammer Strength MTS",
      instructions: "Costas no encosto, empurre as alavancas para frente. Movimento iso-lateral corrige desequilíbrios. Cabos duplos com tensão constante." },
    { name: "Hammer Strength MTS Iso-Lateral Incline Press", muscle: "Peito", equipment: "Máquina", machineBrand: "Hammer Strength MTS",
      instructions: "Costas no encosto inclinado, empurre para cima e para frente. Iso-lateral com cabos duplos. Foco na parte superior do peitoral." },
    { name: "Hammer Strength MTS Shoulder/Chest Press", muscle: "Peito", equipment: "Máquina", machineBrand: "Hammer Strength MTS",
      instructions: "Costas no encosto, empurre as alavancas para cima. Cabos duplos permitem trabalho unilateral. Transição entre supino vertical e desenvolvimento." },
    { name: "Panatta Supine Press (plate-loaded)", muscle: "Peito", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Deite no banco da máquina, costas apoiadas. Empurre as alavancas para cima. Plate-loaded com trajetória convergente italiana." },
    { name: "Panatta Super Lower Chest Flight (plate-loaded)", muscle: "Peito", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Costas no encosto, braços abertos. Faça o movimento de abraço apertando a parte inferior do peito. Plate-loaded, foco no peitoral baixo." },
    { name: "Panatta Inspiration Pec Deck", muscle: "Peito", equipment: "Máquina", machineBrand: "Panatta Inspiration",
      instructions: "Costas no encosto azul, braços nas almofadas. Feche apertando o peito no centro. Série Inspiration com estofado premium." },
    { name: "Matrix Incline Bench (barbell rack)", muscle: "Peito", equipment: "Barra livre", machineBrand: "Matrix",
      instructions: "Deite no banco inclinado, olhos sob a barra. Desça a barra até o peito superior, empurre de volta. Mantenha os pés firmes no chão." },
    { name: "Matrix Flat Bench Press (barbell rack)", muscle: "Peito", equipment: "Barra livre", machineBrand: "Matrix",
      instructions: "Deite no banco, olhos sob a barra. Desça controlando até tocar o peito, empurre explosivo. Pés no chão, glúteos no banco." },
    { name: "Stark Strong Decline Bench (barbell rack)", muscle: "Peito", equipment: "Barra livre", machineBrand: "Stark Strong",
      instructions: "Prenda as pernas, deite no decline. Desça a barra até o peitoral inferior, empurre para cima. Foco no peitoral baixo." },
    { name: "Panatta Converging Chest Press (plate-loaded)", muscle: "Peito", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Costas no encosto, empurre as alavancas convergentes. O movimento converge no centro imitando a contração do supino com halteres. Plate-loaded." },
    { name: "Matrix Adjustable Bench", muscle: "Peito", equipment: "Barra livre", machineBrand: "Matrix",
      instructions: "Banco regulável para uso com halteres. Ajuste a inclinação conforme o exercício. Sirve para supino, fly, desenvolvimento com halteres." },

    // ═══ COSTAS (7 máquinas) ═══
    { name: "Panatta Super Low Row (plate-loaded)", muscle: "Costas", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Apoie o peito no pad, segure as alavancas baixas. Puxe os cotovelos para trás apertando as escápulas. Plate-loaded com trajetória baixa." },
    { name: "Panatta Monolith Seated Row (cabo)", muscle: "Costas", equipment: "Máquina", machineBrand: "Panatta Monolith",
      instructions: "Sente-se, peito no apoio, puxe os cabos para trás. Design Monolith com tensão constante. Aperte as escápulas no final." },
    { name: "Nautilus Impact Lat Pull Down (cabo)", muscle: "Costas", equipment: "Máquina", machineBrand: "Nautilus Impact",
      instructions: "Sente-se com as coxas sob os apoios. Puxe a barra até o peito liderando com os cotovelos. Cam Nautilus com tensão constante." },
    { name: "Hoist ROC-IT Lat Pulldown (plate-loaded)", muscle: "Costas", equipment: "Máquina", machineBrand: "Hoist ROC-IT",
      instructions: "Sente-se, coxas sob os apoios. Puxe as alavancas até o peito. Plate-loaded com ROC-IT que adapta ao seu corpo." },
    { name: "Panatta Lat Pulldown (plate-loaded)", muscle: "Costas", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Sente-se, coxas travadas, puxe as alavancas até o peito. Plate-loaded italiano com trajetória convergente." },
    { name: "Hammer Strength Pulldown/Assisted Chin-Dip", muscle: "Costas", equipment: "Máquina", machineBrand: "Hammer Strength",
      instructions: "Gravitron: ajoelhe na plataforma, selecione o contrapeso. Faça barras ou paralelas com assistência. Quanto mais peso, mais fácil." },
    { name: "Hammer Strength Iso-Lateral High Row", muscle: "Costas", equipment: "Máquina", machineBrand: "Hammer Strength",
      instructions: "Apoie o peito no pad, puxe as alavancas de cima para baixo e para trás. Iso-lateral corrige desequilíbrios. Foco nas escápulas." },

    // ═══ OMBROS (3 máquinas) ═══
    { name: "Hammer Strength MTS Shoulder Press (cabos duplos)", muscle: "Ombros", equipment: "Máquina", machineBrand: "Hammer Strength MTS",
      instructions: "Sente-se ereto, costas no encosto. Empurre para cima sem travar os cotovelos. MTS com cabos duplos permite trabalho unilateral." },
    { name: "Hammer Strength Plate-Loaded Shoulder Press", muscle: "Ombros", equipment: "Máquina", machineBrand: "Hammer Strength",
      instructions: "Sente-se ereto, costas no encosto. Empurre as alavancas para cima. Plate-loaded com trajetória guiada iso-lateral." },
    { name: "Panatta Monolith Shoulder Press (cabo)", muscle: "Ombros", equipment: "Máquina", machineBrand: "Panatta Monolith",
      instructions: "Sente-se ereto, costas no encosto. Empurre para cima controlando. Design Monolith com cabo e tensão constante." },

    // ═══ PERNAS (20+ máquinas) ═══
    { name: "Matrix Seated Leg Extension (cabo)", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Matrix",
      instructions: "Sente-se, costas no encosto, joelhos alinhados com o eixo. Estenda as pernas completamente, aperte no topo 1s. Desça controlando." },
    { name: "Hoist ROC-IT Prone Leg Curl (cabo)", muscle: "Posterior", equipment: "Máquina", machineBrand: "Hoist ROC-IT",
      instructions: "Deite de bruços, calcanhares sob os rolos. Flexione os joelhos trazendo os calcanhares aos glúteos. ROC-IT adapta ao corpo." },
    { name: "Matrix Prone Leg Curl (cabo)", muscle: "Posterior", equipment: "Máquina", machineBrand: "Matrix",
      instructions: "Deite de bruços na máquina preta. Flexione os joelhos controlando. Segure na contração máxima 1-2s." },
    { name: "Hammer Strength Kneeling Leg Curl (plate-loaded)", muscle: "Posterior", equipment: "Máquina", machineBrand: "Hammer Strength",
      instructions: "Ajoelhe na máquina, calcanhares sob o rolo. Flexione os joelhos apertando o posterior. Plate-loaded com trajetória única." },
    { name: "Hammer Strength Standing Leg Curl (plate-loaded)", muscle: "Posterior", equipment: "Máquina", machineBrand: "Hammer Strength",
      instructions: "Em pé, apoie a coxa no pad, calcanhar sob o rolo. Flexione uma perna de cada vez. Plate-loaded, foco unilateral." },
    { name: "Nautilus Seated Leg Curl", muscle: "Posterior", equipment: "Máquina", machineBrand: "Nautilus",
      instructions: "Sente-se, ajuste o rolo na canela. Flexione os joelhos puxando os calcanhares para baixo. Multi-ajuste para diferentes tamanhos." },
    { name: "Life Fitness Linear Leg Press (plate-loaded)", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Life Fitness",
      instructions: "Costas no encosto, pés na plataforma. Empurre a plataforma até quase estender as pernas. Trajetória linear reduz estresse lombar. Não trave os joelhos." },
    { name: "Hoist Leg Press 45° (plate-loaded)", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Hoist",
      instructions: "Costas no encosto a 45°, pés na plataforma na largura dos ombros. Desça até 90° nos joelhos, empurre de volta. Não trave." },
    { name: "Panatta Leg Press 45° (plate-loaded)", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Costas no encosto, pés na plataforma larga. Desça controlando até 90°, empurre explosivo. Design italiano com plataforma extragrande." },
    { name: "Nautilus Leg Press 45°", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Nautilus",
      instructions: "Costas apoiadas, pés na plataforma. Desça até 90° nos joelhos. Cam Nautilus com tensão progressiva. Não trave os joelhos." },
    { name: "Hoist Leg Press (modelo alternativo)", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Hoist",
      instructions: "Costas no encosto, pés na plataforma. Empurre controlando. Modelo alternativo com ângulo diferente para variar estímulo." },
    { name: "Panatta Monolith Hip Thrust (cabo)", muscle: "Glúteos", equipment: "Máquina", machineBrand: "Panatta Monolith",
      instructions: "Costas no apoio, pad na cintura. Empurre o quadril para cima apertando os glúteos no topo. Design Monolith com cabo e tensão constante." },
    { name: "Panatta Hack Squat (plate-loaded)", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Costas no encosto inclinado, ombros sob os apoios. Agache até 90° nos joelhos, empurre de volta. Plate-loaded italiano." },
    { name: "Stark Strong Hack Squat", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Stark Strong",
      instructions: "Costas no encosto, ombros sob os apoios. Agache controlando até 90°, empurre explosivo. Modelo preto robusto." },
    { name: "Panatta Standing Calf Raise (plataforma)", muscle: "Panturrilha", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Ombros nos apoios, pontas dos pés na plataforma. Suba contraindo a panturrilha, segure 2s, desça abaixo da plataforma para alongar." },
    { name: "Hoist ROC-IT Calf Raise (plate-loaded)", muscle: "Panturrilha", equipment: "Máquina", machineBrand: "Hoist ROC-IT",
      instructions: "Sente-se, joelhos sob os apoios, pontas dos pés na plataforma. Suba contraindo, segure 2s. Plate-loaded com ROC-IT." },
    { name: "Panatta V-Squat / Power Squat", muscle: "Quadríceps", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Ombros nos apoios, pés na plataforma. Agache profundo com trajetória V. Isola quadríceps sem sobrecarregar lombar." },
    { name: "Matrix Hip Abduction/Adduction (cabo)", muscle: "Glúteos", equipment: "Máquina", machineBrand: "Matrix",
      instructions: "Sente-se, pernas nas almofadas. Abra (abdução) ou feche (adução) as pernas controlando. Não use impulso. Troque o modo no pino." },
    { name: "Panatta Vertical Knee Raise / Captain's Chair", muscle: "Abdômen", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Apoie os antebraços, costas no encosto. Eleve os joelhos até o peito contraindo o abdômen. Desça controlando. Não balance." },

    // ═══ BRAÇOS (3 máquinas) ═══
    { name: "Life Fitness Biceps Curl (cabo)", muscle: "Bíceps", equipment: "Máquina", machineBrand: "Life Fitness",
      instructions: "Apoie os braços no pad, cotovelos alinhados com o eixo. Flexione controlando e aperte no topo. Cabo com tensão constante." },
    { name: "Panatta Monolith Alternate Arm Curl (cabo)", muscle: "Bíceps", equipment: "Máquina", machineBrand: "Panatta Monolith",
      instructions: "Apoie os braços, flexione um de cada vez alternando. Design Monolith com cabo. Corrige desequilíbrios entre os braços." },
    { name: "Panatta Big Multi Flight / Cable Crossover", muscle: "Peito", equipment: "Máquina", machineBrand: "Panatta",
      instructions: "Em pé entre as colunas, segure os cabos. Puxe os cabos para baixo e para frente cruzando na frente do corpo. Versátil: crossover, rosca, tríceps." },
  ]

  let added = 0
  let skipped = 0
  for (const m of machines) {
    // Check if exists (exact name or similar)
    const exists = await client.query('SELECT id FROM "Exercise" WHERE name = $1', [m.name])
    if (exists.rows.length > 0) {
      console.log(`  Já existe: ${m.name}`)
      skipped++
      continue
    }
    await client.query(
      `INSERT INTO "Exercise" (id, name, muscle, equipment, instructions, "machineBrand")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [m.name, m.muscle, m.equipment, m.instructions, m.machineBrand || ""]
    )
    added++
    console.log(`  + ${m.name} [${m.machineBrand}] (${m.muscle})`)
  }

  const total = await client.query('SELECT COUNT(*) FROM "Exercise"')
  console.log(`\n════════════════════════════════════`)
  console.log(`Adicionados: ${added} | Pulados: ${skipped} | Total no banco: ${total.rows[0].count}`)
  console.log(`════════════════════════════════════`)
  await client.end()
}

addMachines().catch(e => console.error("ERRO:", e.message))
