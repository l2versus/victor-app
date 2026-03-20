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
- manifest.json com icones maskable (192x192, 512x512)
- Apple Touch Icon para iOS
- Meta tags por pagina
- `lang="pt-BR"` nativo
- **PWA Install Banner** — modal orientando instalacao (Android: botao direto, iOS: instrucoes Safari)
- Service Worker para cache e funcionamento offline

### 7. Design & UX
- **Dark mode premium** — tema Ironberg (vermelho #dc2626 + preto #0a0a0a)
- Logo 3D em todo o site (substituiu flat por volume metalico)
- GradientDots background animado (pontos hexagonais vermelhos)
- Ember orbs animados (CSS keyframes custom)
- 15+ animacoes CSS customizadas
- Responsivo mobile-first
- Touch gestures (swipe entre fases do treino + carousel de depoimentos)
- Feedback visual em cada interacao

### 8. Landing Page Premium (Sessao 6)
- **Hero** com video background cinematografico + parallax
- **Depoimentos** — carousel interativo com 6 cases brasileiros, swipe mobile, auto-play inteligente
- **Como Funciona** — 4 passos com TextEffect animado (blur/slide)
- **FAQ** — accordion premium com icones por pergunta + logos 3D flutuantes
- **Footer** — typing animation motivacional + CTA WhatsApp + grid animado
- **Cards de Plano** — CardSpotlight (luz que segue o mouse) + urgencia + social proof
- **Sticky CTA mobile** — barra fixa com preco/dia + botao "Ver planos"
- **Banner de garantia** — 7 dias, verde, grande, posicionado estrategicamente
- **Performance** — scroll throttled, sem WebGL, CSS puro, imagens otimizadas

---

## Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Paginas/Telas | 20+ |
| Endpoints API | 28 |
| Modelos de dados | 15 (User, Student, Exercise, Plan, Subscription, Payment...) |
| Componentes React | 40+ |
| Componentes UI (shadcn) | 12 (button, card, badge, modal, text-effect, etc.) |
| Exercicios pre-carregados | 203 |
| Exercicios com analise de postura IA | 50 |
| Padroes biomecanicos | 13 |
| Hooks customizados | 2 (useRestTimer, useSwipe) |
| System prompts IA | 5 (chat, treino, anamnese, engajamento, Victor Virtual) |
| Animacoes CSS | 15+ keyframes customizados |
| Build time | ~4 segundos (Turbopack) |

---

### 9. Checkout Mercado Pago (Sessao 8)
- SDK `mercadopago` v2.12, lazy init
- `POST /api/checkout` — cria preferencia (slug + CUID lookup)
- `POST /api/webhooks/mercadopago` — IPN completo (HMAC-SHA256, auto user creation, idempotente)
- 3 paginas retorno (success/failure/pending)
- PlanModal com form checkout + fallback WhatsApp

### 10. IA Victor Virtual (Sessao 8)
- Chatbot publico na landing page com streaming
- System prompt com planos, precos, metodo, contatos, CREF real
- Rate limit 30 msgs/hora por IP
- Feature gate: Chat do aluno so Pro/Elite

### 11. Correcao de Postura por IA (Sessoes 8-9) — FEATURE KILLER
- **MediaPipe Pose (Google)** — gratuito, 100% client-side, offline, sem API key
- **50 exercicios** com regras biomecanicas profissionais
- **13 padroes de movimento**: squat, lunge, hinge, push-up, overhead press, curl, tricep extension, raise, row, plank, hip thrust, dip, calf raise
- **11 grupos musculares** com seletor agrupado e busca
- **Dual camera (push-up)**: detecta automaticamente se a camera esta lateral ou frontal
- Camera frontal como padrao (aluno se ve) + botao SwitchCamera
- Canvas overlay: esqueleto 33 pontos + feedback em tempo real (verde/amarelo/vermelho)
- Texto grande legivel a distancia no canvas (15-20px dinamico)
- Aspect ratio retrato (3:4) no mobile
- GPU primeiro, fallback CPU automatico (dispositivos antigos)
- Feature gate: somente plano Elite
- **Diferencial absoluto: NENHUM concorrente tem isso**

### 12. Protecao de Sessao Unica (Sessao 9)
- Campo `sessionVersion` no JWT + banco de dados
- Cada login incrementa versao → invalida sessoes anteriores
- Se logar em 2 dispositivos, o primeiro e kickado com mensagem
- Previne compartilhamento de conta

---

## Roadmap — Proximas Entregas

### Fase 10 — Deploy Producao + Pre-launch
- [ ] Configurar env vars producao (Mercado Pago, IA, APP_URL)
- [ ] Testar checkout end-to-end (sandbox MP)
- [ ] Integrar email transacional (Resend/Nodemailer)
- [ ] GIFs animados de exercicios (ExerciseDB RapidAPI)
- [ ] Comprar dominio (victoroliveiraapersonal.com.br)
- [ ] Auditoria QA pre-launch final

### Fase 11 — Grupo VIP & Comunidade
- [ ] Chat em grupo (alunos do mesmo trainer)
- [ ] Rankings e desafios semanais
- [ ] Compartilhar progresso com outros alunos

### Fase 12 — Nutricao & Saude
- [ ] Plano alimentar basico
- [ ] Tracking de macros simplificado
- [ ] Integracao com IA para sugestoes nutricionais

### Fase 13 — Maquinas de Academia (Projeto Separado)
- [ ] Regras biomecanicas por equipamento especifico
- [ ] QR Code por maquina → abre exercicio correto no app
- [ ] Suporte a marcas: Life Fitness, Hammer Strength, Cybex, Panatta

---

## Diferenciais Competitivos vs MFIT

| Feature | MFIT | Victor App |
|---------|------|-----------|
| Geracao de treino por IA | Nao | Sim — usa biblioteca real de 203 exercicios |
| Chat IA pos-treino | Nao | Sim — streaming real-time |
| Analise de anamnese por IA | Nao | Sim — classifica riscos automaticamente |
| **Correcao de postura por camera** | **Nao** | **Sim — 50 exercicios, 13 padroes biomecanicos, tempo real** |
| Engajamento automatico | Basico | IA gera mensagens personalizadas |
| Design/UX | Generico | Dark mode premium, animacoes custom |
| Planos com feature gates | Basico | Completo — IA, camera, grupo, nutricao |
| PWA / App nativo | Sim | Sim — PWA com manifest, icons, service worker |
| Checkout integrado | Sim | Sim — Mercado Pago (Pix, cartao, boleto) |
| Protecao de conta | Basico | Sessao unica por dispositivo |
| Custo mensal para o trainer | ~R$150/mes | Proprio — sem mensalidade |

---

## Seguranca

- Senhas nunca armazenadas em texto — bcrypt com salt de 12 rounds
- Tokens JWT com expiracao de 7 dias
- Protecao de sessao unica (sessionVersion no JWT)
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
