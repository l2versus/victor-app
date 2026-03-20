# Sessão 14 — Avaliação Corporal IA + MediaPipe Body Composition + Polish

## Contexto
Victor App é uma plataforma fitness (Next.js 16 + Prisma + PostgreSQL + AI SDK).
Sessões 1-13 completas: comunidade, ranking, chat privado, 86+ bugs corrigidos.
Verificar memory em `C:\Users\admin\.claude\projects\c--Users-admin-Desktop-victor-app\memory\`

## O que fazer nesta sessão (em ordem de prioridade):

### 1. AVALIAÇÃO CORPORAL IA COM MEDIAPIPE (FEATURE KILLER — NENHUM CONCORRENTE TEM)
Usar MediaPipe Pose + câmera para estimar proporções corporais e cruzar com objetivos.
- **Fluxo**:
  1. Câmera captura aluno (frente + lateral — 2 fotos ou live)
  2. MediaPipe Pose estima landmarks (ombros, cintura, quadril, pernas)
  3. Calcula ratios: ombro/cintura, cintura/quadril, proporção pernas/tronco
  4. IA cruza com objetivos da anamnese (Assessment type=ANAMNESE → data JSON)
  5. Gera relatório visual: "Seu ratio ombro/cintura é X, pra atingir shape V precisamos de Y"
- **Página /posture/body-scan** (ou tab dentro de /posture):
  - Captura por câmera com guia de silhueta (contorno fantasma)
  - Resultados com corpo SVG e áreas destacadas
  - Comparativo com scan anterior (se houver)
  - Sugestões personalizadas baseadas na anamnese
- **Schema**: BodyScan (studentId, frontPhoto, sidePhoto, measurements JSON, ratios JSON, aiAnalysis)
- **API**: /api/student/body-scan (POST: salvar scan, GET: histórico de scans)
- **Feature gate**: Elite only (hasPostureCamera)
- **UX**: Premium, animação de progresso, glow nos ratios "ideais"

### 2. GERAÇÃO AUTOMÁTICA DE CONQUISTAS NO FEED
Automatizar posts no feed quando alunos batem PRs, streaks, marcos.
- Hook pós-sessão: ao completar workout, checar se bateu PR ou streak
- POST automático em CommunityPost com metadata relevante
- Tipos: PR_PERSONAL (nova carga máxima), STREAK_7, STREAK_30, SESSIONS_50, SESSIONS_100
- Notificação in-app para o aluno ("Você bateu um PR no Supino! 🔥")

### 3. NOTIFICAÇÕES IN-APP
- Bell icon no header com badge de unread count
- Dropdown/drawer com lista de notificações
- Tipos: new_message, challenge_started, achievement, announcement
- Usar model Notification existente no schema

### 4. POLISH BODY MAP + ENCICLOPÉDIA (integrar com sessão paralela)
Se body-map.tsx, muscle-data.ts e muscle-info-card.tsx já existem da sessão paralela:
- Integrar /today com badges "Foco de hoje" + tap para info muscular
- Integrar /evolution com body map interativo
- Empty state premium nos cards de músculo

### 5. ANIMAÇÕES DE CONQUISTA
- Confetti/glow quando aluno bate PR
- Animação de level up no ranking
- Celebration modal com share button

## Regras de ouro:
1. Mobile-first SEMPRE — testar em viewport 375px
2. Dark mode premium (vermelho + preto) — NUNCA branco
3. Glassmorphism nos cards — bg-white/[0.02] + backdrop-blur-xl
4. Touch targets mínimo 44x44px (Apple HIG)
5. Recharts para gráficos, Lucide para ícones
6. Feature gates por plano (subscription.ts)
7. Build limpo antes de commit — 0 erros TypeScript
8. Auditar QA no final da sessão
9. Atualizar memory + VICTOR-APP-OVERVIEW.md no final
10. Design SUPERIOR ao Hevy em todos os aspectos
