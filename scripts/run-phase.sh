#!/bin/bash
# ═══════════════════════════════════════════════════════════
# CTO AUTONOMOUS PIPELINE — Victor App
# ═══════════════════════════════════════════════════════════
# Roda uma fase inteira sem interação humana.
# Cada tarefa é uma sessão Claude Code headless.
#
# USO:
#   bash scripts/run-phase.sh 1     → Fase 1 (Polish)
#   bash scripts/run-phase.sh 2     → Fase 2 (Superar)
#   bash scripts/run-phase.sh 3     → Fase 3 (White-label)
#   bash scripts/run-phase.sh 4     → Fase 4 (Launch)
#   bash scripts/run-phase.sh all   → TODAS as fases
#
# REQUISITO: claude CLI instalado + autenticado
# ═══════════════════════════════════════════════════════════

PHASE="${1:-1}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$DIR/scripts/logs"
mkdir -p "$LOG_DIR"

run_task() {
  local name="$1"
  local prompt="$2"
  local log="$LOG_DIR/$(date +%Y%m%d-%H%M%S)-${name}.log"

  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  TASK: $name"
  echo "  LOG:  $log"
  echo "═══════════════════════════════════════════════"

  claude -p \
    --dangerously-skip-permissions \
    --name "CTO-$name" \
    "$prompt" \
    2>&1 | tee "$log"

  echo ""
  echo "  ✅ $name DONE ($(date +%H:%M:%S))"
  echo ""
}

# ═══ CONTEXT shared by all tasks ═══
CTX="Você é o CTO do Victor App (c:\/Users\/admin\/Desktop\/victor-app).
Stack: Next.js 16.2, React 19, Prisma 7.5, Tailwind 4, Framer Motion 12.
Dark mode Victor Personal (#dc2626 + #0a0a0a). 285 exercícios, 194 com postura.
Componentes: src/components/ui/ (toast, skeleton, motion, safe-image, error-state, stat-card, empty-state, modal, button, card, input).
Brand config: src/lib/branding.ts (BRAND.trainerName, BRAND.appName, etc).
REGRAS: Leia antes de editar. npx tsc --noEmit antes de commitar. git commit ao final. NUNCA pergunte — EXECUTE."

# ═══════════════════════════════════════════════════════════
# FASE 1 — POLISH (igualar Hevy)
# ═══════════════════════════════════════════════════════════
phase1() {
  echo "🔥 FASE 1 — POLISH"

  run_task "gif-inline" "$CTX

TAREFA: Adicionar GIF/video inline nos exercícios do WorkoutPlayer.

1. Leia src/app/(student)/today/workout-player.tsx
2. No preview/detail de cada exercício, se exercise.gifUrl ou exercise.videoUrl existir, mostrar:
   - gifUrl: <img src={gifUrl} className='w-full rounded-xl' /> com loop autoplay
   - videoUrl: <video src={videoUrl} className='w-full rounded-xl aspect-video' autoPlay loop muted playsInline />
3. Usar SafeImage de src/components/ui/safe-image.tsx para o GIF (fallback automático)
4. Adicionar thumbnail clicável que expande para fullscreen
5. Manter dark mode, não quebrar o layout existente
6. npx tsc --noEmit && git add && git commit"

  run_task "share-workout" "$CTX

TAREFA: Criar componente de Share Workout Card pós-treino.

1. Criar src/components/student/share-workout-card.tsx:
   - Props: templateName, exercises (count), totalVolume, duration, streak, trainerName
   - Visual: card dark premium 1080x1920 (Story format) com:
     - Logo/nome da academia (BRAND.appName)
     - Nome do treino
     - Stats: volume, duração, exercícios
     - Streak badge
     - Gradiente vermelho sutil
   - Botão 'Compartilhar' que usa navigator.share() (Web Share API)
   - Fallback: download da imagem se share não disponível
2. Usar html2canvas ou canvas API para gerar imagem
3. Integrar no WorkoutPlayer na fase 'done' (summary final)
4. npx tsc --noEmit && git add && git commit"

  run_task "rest-timer-fullscreen" "$CTX

TAREFA: Melhorar o rest timer para ser fullscreen durante descanso.

1. Leia src/app/(student)/today/workout-player.tsx
2. Encontre o rest timer (fase rest do player)
3. Faça o timer ocupar a tela inteira quando ativo:
   - Background dark com blur
   - Countdown grande centralizado (text-6xl font-bold)
   - Círculo SVG animado ao redor
   - Botão 'Pular' embaixo
   - navigator.vibrate([200]) quando timer acaba
4. Manter z-index correto (z-[70])
5. npx tsc --noEmit && git add && git commit"

  run_task "polish-fixes" "$CTX

TAREFA: Corrigir problemas de polish identificados pelo QA.

1. Corrigir padding duplo em:
   - src/app/(student)/posture/page.tsx: remover p-4 max-w-lg mx-auto duplicado do layout pai
   - src/app/(student)/nutrition/page.tsx: mesmo fix

2. Corrigir modais sem 85dvh:
   - Grep por modais que NÃO tem maxHeight: '85dvh' nos arquivos admin
   - Adicionar style={{ maxHeight: '85dvh' }} + overflow-y-auto onde faltar

3. Corrigir acentos faltando:
   - Grep por 'Configuracoes' (sem acento) e trocar por 'Configurações'
   - Grep por 'Inteligencia' e trocar por 'Inteligência'
   - Grep por 'Visao Geral' e trocar por 'Visão Geral'

4. npx tsc --noEmit && git add && git commit"

  echo "✅ FASE 1 COMPLETA"
}

# ═══════════════════════════════════════════════════════════
# FASE 2 — SUPERAR (features exclusivas)
# ═══════════════════════════════════════════════════════════
phase2() {
  echo "🚀 FASE 2 — SUPERAR"

  run_task "onboarding-wizard" "$CTX

TAREFA: Criar onboarding wizard para personal trainer (primeiro login admin).

1. Criar src/app/(admin)/admin/onboarding/page.tsx:
   - Wizard de 3 passos com progress bar
   - Passo 1: Nome da academia, nome do personal, CREF
   - Passo 2: Upload logo (Vercel Blob), cor primária (color picker que seta --brand-hue)
   - Passo 3: Importar alunos (CSV ou manual)
   - Salvar em TrainerProfile (prisma)
2. No admin layout, verificar se trainer tem onboarding completo
   - Se não, redirect para /admin/onboarding
3. Usar componentes existentes (motion FadeIn, StaggerContainer)
4. npx tsc --noEmit && git add && git commit"

  run_task "progress-charts" "$CTX

TAREFA: Adicionar gráficos de progressão de carga por exercício.

1. Leia src/app/(student)/evolution/evolution-client.tsx
2. Adicione uma seção 'Progressão por Exercício':
   - Dropdown para selecionar exercício
   - Line chart (Recharts) mostrando carga ao longo do tempo
   - Dados: buscar SessionSets agrupados por data
3. Criar endpoint se necessário: GET /api/student/exercise-progress?exerciseId=xxx
4. Usar FadeIn para animação de entrada
5. npx tsc --noEmit && git add && git commit"

  run_task "ia-history" "$CTX

TAREFA: Salvar histórico de gerações IA no Hub.

1. Leia src/app/(admin)/admin/ai/page.tsx (ou ai-client)
2. Criar modelo AiGeneration no schema se não existir:
   - id, trainerId, type (WORKOUT/ANAMNESIS/ENGAGEMENT), prompt, result, createdAt
3. Ao gerar treino/anamnese/engajamento, salvar no banco
4. Mostrar lista de gerações anteriores com botão 'Reusar'
5. npx tsc --noEmit && git add && git commit"

  echo "✅ FASE 2 COMPLETA"
}

# ═══════════════════════════════════════════════════════════
# FASE 3 — WHITE-LABEL
# ═══════════════════════════════════════════════════════════
phase3() {
  echo "🏷️ FASE 3 — WHITE-LABEL"

  run_task "extract-branding" "$CTX

TAREFA: Extrair 'Victor Oliveira' de TODOS os arquivos restantes.

1. Grep recursivo por 'Victor' em src/ (excluir node_modules, .next)
2. Para cada ocorrência, substituir por BRAND.trainerName ou BRAND.appName
3. Arquivos críticos:
   - src/components/landing/landing-page.tsx (8+ ocorrências)
   - src/components/landing/chat-widget.tsx ('Victor Virtual')
   - src/components/ui/typing-effect.tsx
   - src/app/(admin)/admin/settings/
   - Qualquer System Prompt de IA que mencione 'Victor'
4. Import { BRAND } from '@/lib/branding' onde necessário
5. npx tsc --noEmit && git add && git commit"

  run_task "theme-customizer" "$CTX

TAREFA: Criar UI para personal trainer customizar tema.

1. Em /admin/settings ou /admin/onboarding:
   - Color picker que altera --brand-hue (0-360)
   - Preview em tempo real
   - Upload de logo (Vercel Blob)
   - Salvar no TrainerProfile
2. No admin layout, carregar cor do trainer e aplicar via style
3. npx tsc --noEmit && git add && git commit"

  echo "✅ FASE 3 COMPLETA"
}

# ═══════════════════════════════════════════════════════════
# FASE 4 — LAUNCH
# ═══════════════════════════════════════════════════════════
phase4() {
  echo "🚀 FASE 4 — LAUNCH"

  run_task "bot-cron" "$CTX

TAREFA: Migrar bot pós-treino de setTimeout para cron job.

1. Criar modelo PendingBotMessage no schema:
   - id, studentId, sessionId, scheduledAt, sentAt, status
2. Quando aluno completa treino, criar PendingBotMessage (scheduledAt = now + 30-90min)
3. Criar /api/cron/bot-messages:
   - Query: PendingBotMessage where scheduledAt <= now AND sentAt IS NULL
   - Para cada: enviar via Evolution API, marcar sentAt
4. Adicionar cron em vercel.json
5. npx tsc --noEmit && git add && git commit"

  run_task "lead-capture" "$CTX

TAREFA: Implementar captura de leads na landing + abandono checkout.

1. Landing page: adicionar seção 'Quero experimentar' com form nome + WhatsApp
   - POST /api/leads/capture (público, rate limited)
   - Criar lead WARM + source WEBSITE
   - Redirect para 'Obrigado! Victor vai te chamar'

2. Abandono checkout: no modal de checkout da landing
   - Salvar dados do form em sessionStorage
   - Se fechou sem pagar: beacon para /api/leads/capture com tag abandono_checkout
   - Lead HOT + valor do plano

3. npx tsc --noEmit && git add && git commit"

  echo "✅ FASE 4 COMPLETA — READY TO LAUNCH 🚀"
}

# ═══ ROUTER ═══
case "$PHASE" in
  1) phase1 ;;
  2) phase2 ;;
  3) phase3 ;;
  4) phase4 ;;
  all)
    phase1
    phase2
    phase3
    phase4
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║  TODAS AS FASES COMPLETAS             ║"
    echo "║  Victor App — PRONTO PRA LANÇAR 🚀    ║"
    echo "╚═══════════════════════════════════════╝"
    ;;
  *) echo "Uso: bash scripts/run-phase.sh [1|2|3|4|all]" ;;
esac
