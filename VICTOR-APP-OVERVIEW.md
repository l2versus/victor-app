# Victor App — Personal Trainer Platform

**Plataforma completa de gestao para personal trainers e seus alunos**

Documento tecnico para apresentacao ao cliente.

---

## Visao Geral

O **Victor App** e uma plataforma web full-stack desenvolvida sob medida para personal trainers gerenciarem seus alunos, prescreverem treinos, acompanharem evolucao e monetizarem seus servicos — tudo em um unico sistema com inteligencia artificial integrada.

**Objetivo:** Ser superior ao MFIT e concorrentes do mercado fitness, com diferenciais como IA nativa, correcao de postura por camera e design premium dark mode.

---

## Stack Tecnologica

| Camada | Tecnologia | Versao | Por que |
|--------|-----------|--------|---------|
| **Framework** | Next.js (App Router) | 16.2.0 | O framework React mais avancado do mercado, usado por Netflix, TikTok, Uber |
| **Linguagem** | TypeScript | 5.x | Tipagem estatica, menos bugs, codigo mais robusto |
| **Runtime** | React | 19.2 | Ultima versao com Server Components e streaming |
| **Bundler** | Turbopack | Nativo | Substituto do Webpack, 10x mais rapido (Rust) |
| **Banco de Dados** | PostgreSQL | Via Prisma 7.5 | Banco relacional enterprise-grade |
| **ORM** | Prisma | 7.5.0 | Type-safe, migrations, schema declarativo |
| **Inteligencia Artificial** | Vercel AI SDK | 6.x | Streaming real-time, multi-provider (Google Gemini / OpenAI) |
| **Autenticacao** | JWT + bcrypt | Custom | Sessoes seguras, senhas com hash bcrypt-12 |
| **UI Framework** | Tailwind CSS | 4.x | Design system utilitario, responsivo, dark mode |
| **Icones** | Lucide React | 0.577 | 1500+ icones consistentes |
| **Graficos** | Recharts | 3.8 | Graficos interativos para dashboards |
| **Deploy** | Vercel | Edge Network | CDN global, SSL, CI/CD automatico |

---

## Arquitetura do Sistema

```
                    ┌──────────────────────────────┐
                    │      VERCEL EDGE NETWORK      │
                    │   CDN Global · SSL · CI/CD    │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     NEXT.JS 16 APP ROUTER     │
                    │   Server Components · SSR     │
                    │   Streaming · Turbopack       │
                    └──────────┬───────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
    │  PAINEL ADMIN  │ │ APP ALUNO   │ │  APIs REST    │
    │  Dashboard     │ │ Treino Hoje │ │  24 endpoints │
    │  Alunos CRUD   │ │ Historico   │ │  Auth · CRUD  │
    │  Treinos       │ │ Perfil      │ │  AI · Plans   │
    │  Exercicios    │ │ Chat IA     │ │  Student      │
    │  Planos        │ │ Postura*    │ │  Webhooks*    │
    │  IA Tools      │ └─────────────┘ └───────────────┘
    │  Financeiro    │         │                │
    └────────────────┘         │                │
              │        ┌───────▼────────────────▼──┐
              └────────▶   POSTGRESQL + PRISMA ORM  │
                       │   14 modelos · 20+ tabelas │
                       └──────────┬─────────────────┘
                                  │
                       ┌──────────▼─────────────────┐
                       │   GOOGLE GEMINI / OPENAI    │
                       │   IA Streaming · 4 prompts  │
                       └────────────────────────────┘
```

*Itens marcados com * estao no roadmap proximo.

---

## O Que Ja Esta Pronto

### 1. Sistema de Autenticacao
- Login/Registro com JWT seguro
- Senhas com hash bcrypt (12 rounds)
- Middleware de protecao de rotas
- Roles separadas: ADMIN e STUDENT
- Sessoes de 7 dias com renovacao

### 2. Painel Administrativo (Personal Trainer)
- **Dashboard** com metricas em tempo real (alunos, sessoes, pagamentos, exercicios)
- **CRUD completo de alunos** — cadastro, status (ativo/inativo/pendente), detalhes
- **Workout Builder** — montagem de treinos com drag-to-reorder, supersets, notas por exercicio
- **Biblioteca de 203 exercicios** — busca, filtro por musculo, exercicios customizados
- **Plano semanal** — atribuir treinos a dias da semana por aluno
- **Pagina de Planos** — criar planos (Mensal/Trimestral/Anual), definir features por plano, atribuir alunos
- **Navegacao** — sidebar desktop + bottom nav mobile, ambos responsivos

### 3. Hub de Inteligencia Artificial
- **Geracao de treinos por IA** — formulario completo (objetivo, nivel, equipamentos, restricoes, dias/semana) usando a biblioteca real de 203 exercicios como contexto
- **Analise de anamnese** — identifica restricoes absolutas/relativas, pontos de atencao, recomendacoes clinicas
- **Mensagens de engajamento** — gera mensagens motivacionais automaticas para alunos inativos (3+ dias), com opcao de copiar e regenerar

### 4. App do Aluno
- **Treino de Hoje** — workout player interativo com 5 fases (preview → active → rest → summary → done)
- **Timer circular de descanso** — animacao requestAnimationFrame, configuravel por exercicio
- **Registro de series** — marcar reps, carga, RPE por serie
- **Historico** — calendar heatmap, lista de sessoes, streak badge
- **Perfil** — avatar, medidas corporais, IMC automatico, stats, modo edicao
- **Chat com IA** — streaming real-time, bolhas de conversa, typing indicator, auto-scroll, welcome message

### 5. Sistema de Planos & Assinaturas
- **4 intervalos**: Mensal, Trimestral, Semestral, Anual
- **Feature flags por plano**: Chat IA, Camera de Postura, Grupo VIP, Nutricao
- **Limite de sessoes/semana** configuravel por plano
- **API de verificacao** — checa features liberadas do aluno em tempo real
- **Cancelamento automatico** da assinatura anterior ao atribuir nova

### 6. SEO & PWA
- Open Graph + Twitter Cards (compartilhamento rich)
- JSON-LD Schema.org (Person — busca Google)
- robots.txt inteligente (bloqueia /api/, /admin/)
- sitemap.xml dinamico
- manifest.json (PWA-ready)
- Meta tags por pagina
- `lang="pt-BR"` nativo

### 7. Design & UX
- **Dark mode premium** — inspiracao Apple/Vercel
- Glassmorphism com backdrop-blur
- Ember orbs animados (CSS keyframes custom)
- Noise texture sutil
- 10+ animacoes CSS customizadas
- Responsivo mobile-first
- Touch gestures (swipe entre fases do treino)
- Feedback visual em cada interacao

---

## Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Paginas/Telas | 15+ |
| Endpoints API | 24 |
| Modelos de dados | 14 (User, Student, Exercise, Plan, Subscription...) |
| Componentes React | 18+ |
| Exercicios pre-carregados | 203 |
| Hooks customizados | 2 (useRestTimer, useSwipe) |
| System prompts IA | 4 (chat, treino, anamnese, engajamento) |
| Build time | ~3 segundos (Turbopack) |

---

## Roadmap — Proximas Entregas

### Fase 6 — Checkout & Monetizacao
- [ ] Pagina publica de planos com pricing cards
- [ ] Integracao Mercado Pago (Checkout Pro)
- [ ] Pagamento via Pix, cartao, boleto
- [ ] Webhook de confirmacao → cria conta + ativa plano automaticamente
- [ ] Carteira/Wallet no painel admin (saldo, historico, saques)
- [ ] Cobranca recorrente automatica

### Fase 7 — Correcao de Postura por Camera (Feature Killer)
- [ ] MediaPipe Pose (Google) rodando no browser
- [ ] Deteccao de 33 pontos do corpo em tempo real
- [ ] Comparacao de angulos articulares com padrao correto do exercicio
- [ ] Feedback visual em tempo real ("Desça mais o quadril", "Cotovelos alinhados")
- [ ] Historico de correcoes por exercicio
- **Diferencial: MFIT nao tem isso**

### Fase 8 — PWA Completo & Notificacoes
- [ ] Service Worker (offline-first)
- [ ] Push notifications (lembrete de treino, pagamento, motivacao)
- [ ] Instalar como app nativo no celular
- [ ] Cache inteligente de exercicios e treinos

### Fase 9 — Grupo VIP & Comunidade
- [ ] Chat em grupo (alunos do mesmo trainer)
- [ ] Rankings e desafios semanais
- [ ] Compartilhar progresso com outros alunos

### Fase 10 — Nutricao & Saude
- [ ] Plano alimentar basico
- [ ] Tracking de macros simplificado
- [ ] Integracao com IA para sugestoes nutricionais

---

## Diferenciais Competitivos vs MFIT

| Feature | MFIT | Victor App |
|---------|------|-----------|
| Geracao de treino por IA | Nao | Sim — usa biblioteca real de exercicios |
| Chat IA pos-treino | Nao | Sim — streaming real-time |
| Analise de anamnese por IA | Nao | Sim — classifica riscos automaticamente |
| Correcao de postura por camera | Nao | Em desenvolvimento (MediaPipe) |
| Engajamento automatico | Basico | IA gera mensagens personalizadas |
| Design/UX | Generico | Dark mode premium, animacoes custom |
| Planos com feature gates | Basico | Completo — IA, camera, grupo, nutricao |
| PWA / App nativo | Sim | Em desenvolvimento |
| Checkout integrado | Sim | Em desenvolvimento (Mercado Pago) |
| Custo mensal para o trainer | ~R$150/mes | Proprio — sem mensalidade |

---

## Seguranca

- Senhas nunca armazenadas em texto — bcrypt com salt de 12 rounds
- Tokens JWT com expiracao de 7 dias
- Rotas protegidas por middleware (admin e student separados)
- robots.txt bloqueia indexacao de areas privadas
- Variaveis sensiveis via .env (nunca commitadas)
- HTTPS forcado via Vercel Edge Network

---

## Como Rodar

```bash
# Instalar dependencias
npm install

# Configurar banco de dados
# Criar .env com DATABASE_URL=postgresql://...

# Gerar Prisma Client
npx prisma generate

# Push do schema para o banco
npx prisma db push

# Seed da biblioteca de exercicios
npx prisma db seed

# Iniciar dev server
npm run dev
```

---

**Desenvolvido por Emmanuel** | Next.js 16 + TypeScript + Prisma + AI SDK | 2026
