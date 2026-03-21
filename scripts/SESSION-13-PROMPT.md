# Sessão 13 — Comunidade + Ranking + Chat Privado + Deploy Produção

## Contexto
Victor App é uma plataforma fitness (Next.js 16 + Prisma + PostgreSQL + AI SDK).
Sessões 1-12 completas: 86 bugs corrigidos, 54 rotas, 203 exercícios, 50 com correção postura IA.
Build limpo, push to main feito. Precisa de 3 API keys do Victor para produção.
Verificar memory em `C:\Users\admin\.claude\projects\c--Users-admin-Desktop-victor-app\memory\`

## O que fazer nesta sessão (em ordem de prioridade):

### 1. Comunidade + Ranking de Alunos (FEATURE PRINCIPAL)
Criar sistema de comunidade inspirado na referência de ranking de vendedores, adaptado para fitness.
- **Schema Prisma**: CommunityPost, CommunityReaction, DirectMessage, Challenge, ChallengeEntry
- **Página /community no app do aluno**:
  - Tab "Ranking": Pódio top 3 com foto/avatar, lista posições 4-10+, filtros (mês/semana/geral)
  - Tab "Feed": Conquistas automáticas (PR, streak, sessões), reações (clap/fire/muscle)
  - Tab "Desafios": Desafios ativos criados pelo Victor, participação, ranking do desafio
- **Chat privado Victor ↔ Aluno**:
  - Página /admin/messages no painel do Victor (lista alunos, chat individual)
  - Página /messages no app do aluno (conversas com Victor)
  - Real-time ou polling 30s
- **APIs**: /api/community/ranking, /api/community/feed, /api/community/challenges, /api/messages
- **Feature gates**: Ranking (todos), Feed/Desafios (Pro+Elite), Chat privado (Elite)
- **Design**: Tema Victor (vermelho #dc2626 + preto #0a0a0a), glassmorphism, mobile-first
- **Métricas ranking**: Volume total (reps × carga), Streak semanal, Sessões no mês, Consistência %

### 2. Admin: Gestão de Comunidade
- Painel para Victor criar desafios semanais
- Lista de mensagens diretas com alunos
- Anúncios (broadcast para todos alunos)
- Moderação do feed (se necessário)

### 3. Deploy Produção (se Victor trouxer as keys)
- Configurar: MERCADOPAGO_WEBHOOK_SECRET, GOOGLE_AI_API_KEY, RESEND_API_KEY
- Testar checkout sandbox E2E
- Script: `scripts/setup-keys-live.sh`
- Trocar credenciais MP teste → produção
- Apagar contas de teste

### 4. Polish UX (se sobrar tempo)
- Body map visual na distribuição muscular (SVG silhueta com cores por grupo)
- Monthly stats comparativo (Hevy-style: "Este mês vs mês passado")
- Notificações in-app (bell icon no header)
- Animações de conquista (confetti/glow quando bate PR)

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
