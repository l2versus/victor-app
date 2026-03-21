# Sessão 17 — Deploy Produção + Máquinas (QR) + Animações + GIFs

## Contexto
Victor App é uma plataforma fitness (Next.js 16 + Prisma + PostgreSQL + AI SDK).
Sessões 1-16 completas. Nutrição, Push Notifications, MFIT importer, community, body scan — tudo pronto.
Verificar memory em `C:\Users\admin\.claude\projects\c--Users-admin-Desktop-victor-app\memory\`

## Estado atual do app (74 páginas, 0 erros TS)

### Features completas:
- Auth JWT + single-session protection
- Admin: students, workouts, exercises (203), plans (3 tiers × 4 durações), finance, AI tools, MFIT importer
- Student: today workout, posture (50 exercícios MediaPipe), body scan IA (Elite), evolution (charts, PRs, PDF), community (ranking, feed, desafios), messages (Elite), nutrition (Pro+Elite), profile + push toggle
- Landing page + checkout Mercado Pago + email Resend
- PWA: sw.js v3 com push notifications, VAPID keys geradas

### API keys AINDA faltando no Coolify (CRÍTICO para produção):
- `ANTHROPIC_API_KEY` — IA não funciona sem isso (chat, feedback, body scan, anamnese, nutrição)
- `MERCADOPAGO_WEBHOOK_SECRET` — webhooks de pagamento não funcionam
- `RESEND_API_KEY` — emails de boas-vindas não disparam
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — push não funciona em produção

## O que fazer nesta sessão (em ordem de prioridade):

### 1. DEPLOY PRODUÇÃO (se Victor trouxer as keys)
- Rodar `scripts/validate-keys.sh` para checar variáveis no Coolify
- Configurar as 4+ keys no painel Coolify (ou via Vercel dashboard)
- VAPID keys: usar os valores do `.env.local` já gerados
- Trocar MP SANDBOX → MP PRODUÇÃO (public key + access token)
- Testar fluxo completo: registro → plano → PIX → ativação → treino → nutrição
- Apagar contas de teste (emmanuel@teste.com, victoradmin@teste.com)
- Configurar domínio victoroliveiraapersonal.com.br + SSL automático
- Testar push notification end-to-end no celular real

### 2. ANIMAÇÕES PREMIUM (CELEBRATION + CONFETTI)
- **Celebration Modal** quando aluno quebra PR (Personal Record):
  - Aparece depois de completar sessão se detectou novo PR (via hook achievement existente)
  - Design: fundo escuro glassmorphism, confetti animado, badge ✨ "Novo Recorde!", exercício + carga
  - Botão "Compartilhar" (Web Share API → compartilha imagem/texto no WhatsApp)
  - Botão "Ver Evolução" → `/evolution`
  - Fechar com swipe down ou X
- **Confetti no Ranking** quando aluno sobe de posição:
  - Small confetti burst ao entrar em /community com posição melhor que semana anterior
- **PR Glow na Evolução**: quando uma série é novo PR, mostrar badge 🔥 animado inline na tabela
- **Level Up Notification**: quando aluno completa milestone (50 sessões, streak 30d, etc), toast especial no topo com animação de entrada
- **Package**: `canvas-confetti` (leve, sem dependências)

### 4. GIFs ANIMADOS — ExerciseDB RapidAPI
- ExerciseDB tem GIFs de 1300+ exercícios gratuitos via RapidAPI (plano free: 10 req/day)
- **Estratégia**: Popular GIFs no banco durante o cadastro do exercício (cache permanente)
  - Campo `gifUrl` já existe no schema Exercise
  - Admin: ao criar/editar exercício, botão "Buscar GIF" → chama ExerciseDB por nome
  - Mostra preview do GIF + confirmar
  - Salva URL do GIF no banco (evita req repetidas)
- **Student**: GIF animado no card do exercício durante o treino (lazy load, fallback graceful)
- **API**: `GET /api/admin/exercises/gif?name=...` → proxy para ExerciseDB
- Env: `RAPIDAPI_KEY` no Coolify

### 5. LANDING PAGE V2 (se sobrar tempo)
- **Hero** com vídeo loop (Victor treinando) — substituir imagem estática
  - `<video autoplay loop muted playsinline>` com fallback para imagem
  - Overlay dark gradient preserva legibilidade do texto
- **Seção Antes/Depois** (com autorização dos alunos):
  - Cards de transformação side-by-side
  - Nome, duração, plano usado
- **Seção "Como funciona"** — 3 passos animados (scroll reveal)
- **Seção Tecnologia**: IA + MediaPipe + postura + body scan
- **Depoimentos V2**: fotos reais dos alunos

## Checklist de qualidade para TUDO que for feito:
- [ ] Mobile-first — testar em 375px width
- [ ] Dark mode premium (vermelho/vermelho escuro + preto) — NUNCA branco
- [ ] Glassmorphism nos cards — `bg-white/[0.02] backdrop-blur-xl`
- [ ] Touch targets mínimo 44×44px (Apple HIG)
- [ ] Build limpo — 0 erros TypeScript antes de encerrar
- [ ] `prisma db push` se schema mudar
- [ ] Atualizar memory no final da sessão

## Arquivos-chave para consultar:
- `prisma/schema.prisma` — schema completo (6 modelos novos nesta sessão)
- `src/lib/student.ts` — pattern `requireStudent()`
- `src/lib/subscription.ts` — pattern `checkFeature()`
- `src/app/api/student/body-scan/route.ts` — template de API route
- `src/app/(student)/posture/body-scan/page.tsx` — template de page com feature gate
- `src/components/student/nav.tsx` — nav com hasNutrition prop
- `src/app/(student)/layout.tsx` — layout que passa features ao nav
- `src/app/api/admin/push/broadcast/route.ts` — admin push com getWebPush()

## Regras de ouro:
1. Mobile-first SEMPRE — viewport 375px é o padrão
2. Dark mode premium (vermelho + preto) — NUNCA branco
3. Glassmorphism nos cards — bg-white/[0.02] + backdrop-blur-xl
4. Touch targets mínimo 44×44px (Apple HIG)
5. Build limpo antes de commit — 0 erros TypeScript
6. QA audit completo no final
7. Atualizar memory no final
8. Design SUPERIOR ao Hevy em todos os aspectos
9. Tailwind v4 canonical classes — usar bg-white/4 não bg-white/[0.04]
