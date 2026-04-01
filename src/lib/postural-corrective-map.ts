/**
 * Maps postural finding keys → corrective exercise IDs
 * IDs reference exercises in the posture-rules-all.ts library
 * Based on: Kendall (2005), NASM Corrective Exercise guidelines
 */

export const CORRECTIVE_MAP: Record<string, string[]> = {
  head_tilt: [
    "neck-lateral-flexion",
    "upper-trap-stretch",
  ],
  shoulder_level: [
    "levator-scapulae-stretch",
    "shoulder-shrug",
    "side-plank",
  ],
  hip_level: [
    "side-plank",
    "single-leg-deadlift",
    "hip-hike",
  ],
  knee_alignment: [
    "clamshell",
    "glute-bridge",
    "agachamento",
  ],
  trunk_rotation: [
    "pallof-press",
    "dead-bug",
    "prancha",
  ],
  scoliosis: [
    "prancha-lateral",
    "dead-bug",
    "bird-dog",
  ],
  forward_head: [
    "chin-tuck",
    "wall-angel",
    "face-pull",
  ],
  kyphosis: [
    "wall-angel",
    "face-pull",
    "remada-curvada",
  ],
  lordosis: [
    "dead-bug",
    "prancha",
    "glute-bridge",
  ],
  pelvic_tilt: [
    "hip-flexor-stretch",
    "glute-bridge",
    "dead-bug",
  ],
  knee_hyperextension: [
    "leg-curl",
    "romanian-deadlift",
    "step-down",
  ],
  ankle_alignment: [
    "calf-raise",
    "ankle-dorsiflexion",
    "single-leg-balance",
  ],
}

/** Human-readable names for corrective exercises (PT-BR) */
export const CORRECTIVE_NAMES: Record<string, string> = {
  "neck-lateral-flexion": "Flexão Lateral Cervical",
  "upper-trap-stretch": "Alongamento Trapézio Superior",
  "levator-scapulae-stretch": "Alongamento Elevador da Escápula",
  "shoulder-shrug": "Encolhimento de Ombros",
  "side-plank": "Prancha Lateral",
  "single-leg-deadlift": "Stiff Unilateral",
  "hip-hike": "Elevação de Quadril",
  "clamshell": "Clamshell (Concha)",
  "glute-bridge": "Ponte Glútea",
  "agachamento": "Agachamento Livre",
  "pallof-press": "Pallof Press",
  "dead-bug": "Dead Bug",
  "prancha": "Prancha Abdominal",
  "prancha-lateral": "Prancha Lateral",
  "bird-dog": "Bird Dog (4 apoios)",
  "chin-tuck": "Retração Cervical (Chin Tuck)",
  "wall-angel": "Anjo na Parede",
  "face-pull": "Face Pull",
  "remada-curvada": "Remada Curvada",
  "hip-flexor-stretch": "Alongamento Flexor do Quadril",
  "leg-curl": "Leg Curl (Flexão de Pernas)",
  "romanian-deadlift": "Stiff / Levantamento Romeno",
  "step-down": "Step Down",
  "calf-raise": "Elevação de Panturrilha",
  "ankle-dorsiflexion": "Dorsiflexão de Tornozelo",
  "single-leg-balance": "Equilíbrio Unipodal",
}
