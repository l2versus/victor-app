/**
 * Enciclopédia muscular — dados educativos para o aluno.
 * Cada grupo muscular tem: músculos alvos, sinergistas, antagonistas,
 * tipo de contração dominante, dica rápida e ícone.
 */

export interface MuscleInfo {
  /** Nome do grupo (mesmo usado no banco) */
  name: string
  /** Emoji representativo */
  icon: string
  /** Label em PT-BR */
  label: string
  /** Músculos principais treinados */
  targets: string[]
  /** Músculos que auxiliam o movimento (sinergistas) */
  synergists: string[]
  /** Músculos opostos (antagonistas) — descansar no dia seguinte */
  antagonists: string[]
  /** Pico de contração — onde o músculo trabalha mais */
  peakContraction: string
  /** Dica rápida para o aluno */
  tip: string
  /** Cor do grupo no app */
  color: string
}

export const muscleDatabase: Record<string, MuscleInfo> = {
  // ─── PEITO ───
  Peito: {
    name: "Peito",
    icon: "💪",
    label: "Peitoral",
    targets: ["Peitoral Maior", "Peitoral Menor"],
    synergists: ["Deltóide Anterior", "Tríceps"],
    antagonists: ["Costas (dorsais)", "Bíceps"],
    peakContraction: "No topo do supino, quando os braços estão estendidos — aperte o peito como se fosse abraçar uma árvore",
    tip: "Mantenha as escápulas retraídas (ombros para trás) durante todo o movimento para isolar melhor o peitoral",
    color: "#22c55e",
  },
  Peitoral: {
    name: "Peitoral",
    icon: "💪",
    label: "Peitoral",
    targets: ["Peitoral Maior", "Peitoral Menor"],
    synergists: ["Deltóide Anterior", "Tríceps"],
    antagonists: ["Costas (dorsais)", "Bíceps"],
    peakContraction: "No topo do supino, quando os braços estão estendidos — aperte o peito como se fosse abraçar uma árvore",
    tip: "Mantenha as escápulas retraídas (ombros para trás) durante todo o movimento para isolar melhor o peitoral",
    color: "#22c55e",
  },

  // ─── COSTAS ───
  Costas: {
    name: "Costas",
    icon: "🔙",
    label: "Dorsais",
    targets: ["Latíssimo do Dorso", "Trapézio", "Romboides"],
    synergists: ["Bíceps", "Deltóide Posterior", "Antebraço"],
    antagonists: ["Peitoral", "Deltóide Anterior"],
    peakContraction: "Na fase final da puxada — imagine tentar colocar os cotovelos nos bolsos de trás da calça",
    tip: "Puxe com os cotovelos, não com as mãos. Isso ativa mais as costas e menos o bíceps",
    color: "#3b82f6",
  },
  "Costas (Geral)": {
    name: "Costas (Geral)",
    icon: "🔙",
    label: "Dorsais",
    targets: ["Latíssimo do Dorso", "Trapézio", "Romboides"],
    synergists: ["Bíceps", "Deltóide Posterior", "Antebraço"],
    antagonists: ["Peitoral", "Deltóide Anterior"],
    peakContraction: "Na fase final da puxada — imagine tentar colocar os cotovelos nos bolsos de trás da calça",
    tip: "Puxe com os cotovelos, não com as mãos. Isso ativa mais as costas e menos o bíceps",
    color: "#3b82f6",
  },

  // ─── OMBROS ───
  Ombros: {
    name: "Ombros",
    icon: "🏋️",
    label: "Deltóides",
    targets: ["Deltóide Anterior", "Deltóide Lateral", "Deltóide Posterior"],
    synergists: ["Trapézio", "Tríceps (em presses)"],
    antagonists: ["Latíssimo do Dorso"],
    peakContraction: "Na elevação lateral: quando o braço está paralelo ao chão — segure 1s nessa posição",
    tip: "Ombro tem 3 cabeças (frente, lado, trás). Treinos de peito já recrutam a frente, então foque mais na lateral e posterior",
    color: "#8b5cf6",
  },
  Deltoides: {
    name: "Deltoides",
    icon: "🏋️",
    label: "Deltóides",
    targets: ["Deltóide Anterior", "Deltóide Lateral", "Deltóide Posterior"],
    synergists: ["Trapézio", "Tríceps (em presses)"],
    antagonists: ["Latíssimo do Dorso"],
    peakContraction: "Na elevação lateral: quando o braço está paralelo ao chão — segure 1s nessa posição",
    tip: "Ombro tem 3 cabeças (frente, lado, trás). Treinos de peito já recrutam a frente, então foque mais na lateral e posterior",
    color: "#8b5cf6",
  },

  // ─── BÍCEPS ───
  Bíceps: {
    name: "Bíceps",
    icon: "🦾",
    label: "Bíceps Braquial",
    targets: ["Bíceps Braquial (cabeça longa e curta)", "Braquial"],
    synergists: ["Braquiorradial (antebraço)", "Deltóide Anterior"],
    antagonists: ["Tríceps"],
    peakContraction: "No topo da rosca, com o punho supinado (palma pra cima) — aperte forte por 1s antes de descer",
    tip: "Não balance o corpo. Cotovelo fixo ao lado. Se precisar balançar, a carga está pesada demais",
    color: "#ec4899",
  },

  // ─── TRÍCEPS ───
  Tríceps: {
    name: "Tríceps",
    icon: "🔱",
    label: "Tríceps Braquial",
    targets: ["Cabeça Longa", "Cabeça Lateral", "Cabeça Medial"],
    synergists: ["Deltóide Anterior", "Peitoral (em presses)"],
    antagonists: ["Bíceps"],
    peakContraction: "Na extensão total do cotovelo — braço completamente estendido. Aperte o tríceps no final",
    tip: "Tríceps é 2/3 do braço. Se quer braço grande, tríceps > bíceps. Foque na cabeça longa (overhead extensions)",
    color: "#14b8a6",
  },

  // ─── QUADRÍCEPS ───
  Quadríceps: {
    name: "Quadríceps",
    icon: "🦵",
    label: "Quadríceps Femoral",
    targets: ["Reto Femoral", "Vasto Lateral", "Vasto Medial", "Vasto Intermédio"],
    synergists: ["Glúteos", "Adutores", "Core"],
    antagonists: ["Isquiotibiais (posterior de coxa)"],
    peakContraction: "No topo da cadeira extensora, com a perna totalmente estendida — ou na subida do agachamento",
    tip: "Agachamento profundo (abaixo de 90°) recruta mais o vasto medial (a 'gota' acima do joelho)",
    color: "#ef4444",
  },
  Quadriceps: {
    name: "Quadriceps",
    icon: "🦵",
    label: "Quadríceps Femoral",
    targets: ["Reto Femoral", "Vasto Lateral", "Vasto Medial", "Vasto Intermédio"],
    synergists: ["Glúteos", "Adutores", "Core"],
    antagonists: ["Isquiotibiais (posterior de coxa)"],
    peakContraction: "No topo da cadeira extensora, com a perna totalmente estendida — ou na subida do agachamento",
    tip: "Agachamento profundo (abaixo de 90°) recruta mais o vasto medial (a 'gota' acima do joelho)",
    color: "#ef4444",
  },

  // ─── POSTERIOR DE COXA ───
  "Posterior de Coxa": {
    name: "Posterior de Coxa",
    icon: "🦿",
    label: "Isquiotibiais",
    targets: ["Bíceps Femoral", "Semitendinoso", "Semimembranoso"],
    synergists: ["Glúteos", "Panturrilha"],
    antagonists: ["Quadríceps"],
    peakContraction: "Na mesa flexora: quando o calcanhar está mais perto do glúteo — aperte forte",
    tip: "Stiff (terra romeno) é o melhor exercício pra posterior. Mantenha as costas retas e sinta o alongamento atrás da coxa",
    color: "#f97316",
  },
  Hamstrings: {
    name: "Hamstrings",
    icon: "🦿",
    label: "Isquiotibiais",
    targets: ["Bíceps Femoral", "Semitendinoso", "Semimembranoso"],
    synergists: ["Glúteos", "Panturrilha"],
    antagonists: ["Quadríceps"],
    peakContraction: "Na mesa flexora: quando o calcanhar está mais perto do glúteo — aperte forte",
    tip: "Stiff (terra romeno) é o melhor exercício pra posterior. Mantenha as costas retas e sinta o alongamento atrás da coxa",
    color: "#f97316",
  },

  // ─── GLÚTEOS ───
  Glúteos: {
    name: "Glúteos",
    icon: "🍑",
    label: "Glúteo Máximo",
    targets: ["Glúteo Máximo", "Glúteo Médio", "Glúteo Mínimo"],
    synergists: ["Quadríceps", "Posterior de Coxa", "Core"],
    antagonists: ["Flexores do Quadril"],
    peakContraction: "No topo do hip thrust ou na extensão total do quadril — aperte o glúteo como se fosse quebrar uma noz",
    tip: "Hip thrust é o exercício #1 pra glúteo. Maior ativação EMG que agachamento. Mente-músculo é essencial aqui",
    color: "#eab308",
  },
  Gluteos: {
    name: "Gluteos",
    icon: "🍑",
    label: "Glúteo Máximo",
    targets: ["Glúteo Máximo", "Glúteo Médio", "Glúteo Mínimo"],
    synergists: ["Quadríceps", "Posterior de Coxa", "Core"],
    antagonists: ["Flexores do Quadril"],
    peakContraction: "No topo do hip thrust ou na extensão total do quadril — aperte o glúteo como se fosse quebrar uma noz",
    tip: "Hip thrust é o exercício #1 pra glúteo. Maior ativação EMG que agachamento. Mente-músculo é essencial aqui",
    color: "#eab308",
  },

  // ─── PANTURRILHA ───
  Panturrilha: {
    name: "Panturrilha",
    icon: "🦶",
    label: "Tríceps Sural",
    targets: ["Gastrocnêmio (lateral e medial)", "Sóleo"],
    synergists: ["Tibial Posterior"],
    antagonists: ["Tibial Anterior"],
    peakContraction: "Na ponta dos pés (plantiflexão máxima) — segure 2s no topo de cada repetição",
    tip: "Panturrilha precisa de alto volume (15-20 reps). O sóleo é ativado com joelho flexionado (panturrilha sentado)",
    color: "#6366f1",
  },
  Calves: {
    name: "Calves",
    icon: "🦶",
    label: "Tríceps Sural",
    targets: ["Gastrocnêmio (lateral e medial)", "Sóleo"],
    synergists: ["Tibial Posterior"],
    antagonists: ["Tibial Anterior"],
    peakContraction: "Na ponta dos pés (plantiflexão máxima) — segure 2s no topo de cada repetição",
    tip: "Panturrilha precisa de alto volume (15-20 reps). O sóleo é ativado com joelho flexionado (panturrilha sentado)",
    color: "#6366f1",
  },

  // ─── CORE / ABDÔMEN ───
  Abdômen: {
    name: "Abdômen",
    icon: "🎯",
    label: "Core / Abdômen",
    targets: ["Reto Abdominal", "Oblíquos Interno e Externo", "Transverso Abdominal"],
    synergists: ["Flexores do Quadril", "Eretores da Espinha"],
    antagonists: ["Eretores da Espinha (lombar)"],
    peakContraction: "No crunch: quando o tronco está flexionado e o abdômen está 'espremido' — expire forte nesse ponto",
    tip: "Prancha treina estabilidade. Crunch treina flexão. Os dois são importantes. Abdômen aparece com dieta, não com mil crunches",
    color: "#f59e0b",
  },
  Core: {
    name: "Core",
    icon: "🎯",
    label: "Core / Abdômen",
    targets: ["Reto Abdominal", "Oblíquos Interno e Externo", "Transverso Abdominal"],
    synergists: ["Flexores do Quadril", "Eretores da Espinha"],
    antagonists: ["Eretores da Espinha (lombar)"],
    peakContraction: "No crunch: quando o tronco está flexionado e o abdômen está 'espremido' — expire forte nesse ponto",
    tip: "Prancha treina estabilidade. Crunch treina flexão. Os dois são importantes. Abdômen aparece com dieta, não com mil crunches",
    color: "#f59e0b",
  },

  // ─── TRAPÉZIO / ANTEBRAÇO ───
  Trapézio: {
    name: "Trapézio",
    icon: "⬆️",
    label: "Trapézio",
    targets: ["Trapézio Superior", "Trapézio Médio", "Trapézio Inferior"],
    synergists: ["Deltóide", "Romboides"],
    antagonists: ["Peitoral"],
    peakContraction: "No encolhimento: ombros o mais perto possível das orelhas — segure 2s no topo",
    tip: "Remada alta e encolhimento são os melhores. Não gire os ombros — suba e desça em linha reta",
    color: "#84cc16",
  },
  Antebraço: {
    name: "Antebraço",
    icon: "🤜",
    label: "Antebraço",
    targets: ["Braquiorradial", "Flexores e Extensores do Punho"],
    synergists: ["Bíceps (rosca martelo)"],
    antagonists: ["Extensores do punho"],
    peakContraction: "Na rosca martelo ou punho: aperte forte o punho como se fosse esmagar algo",
    tip: "Rosca martelo é o melhor exercício. Treina bíceps + braquiorradial + braquial ao mesmo tempo",
    color: "#06b6d4",
  },
}

/**
 * Busca info muscular por nome. Tenta match exato, depois parcial.
 */
export function getMuscleInfo(muscleName: string): MuscleInfo | null {
  if (muscleDatabase[muscleName]) return muscleDatabase[muscleName]

  // Partial match
  const lower = muscleName.toLowerCase()
  for (const [key, info] of Object.entries(muscleDatabase)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return info
    }
  }
  return null
}
