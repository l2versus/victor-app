#!/bin/bash
# CTO Autonomous Session — Victor App
# Usage: bash scripts/cto-session.sh "tarefa aqui"
# Exemplo: bash scripts/cto-session.sh "Fase 1.1: GIF inline nos exercícios"

TASK="${1:-Fase 1: Polish completo}"

cd "$(dirname "$0")/.."

claude -p \
  --dangerously-skip-permissions \
  --model claude-opus-4-6 \
  --name "CTO-Auto" \
  "Você é o CTO do Victor App. Execute esta tarefa COMPLETAMENTE sem perguntar nada:

TAREFA: $TASK

REGRAS:
1. Leia o código antes de editar
2. Use subagentes para tarefas paralelas
3. Rode npx tsc --noEmit antes de commitar
4. Commite ao final com mensagem descritiva
5. Se encontrar bug, corrija
6. Se algo não compilar, conserte

CONTEXTO:
- Next.js 16.2, React 19, Prisma 7.5, Tailwind 4
- Dark mode Victor Personal (#dc2626 + #0a0a0a)
- Componentes em src/components/ui/ (toast, skeleton, motion, safe-image, etc.)
- Branding centralizado em src/lib/branding.ts
- 285 exercícios, 194 com postura, 52 máquinas 3D

EXECUTE TUDO E COMMITE."
