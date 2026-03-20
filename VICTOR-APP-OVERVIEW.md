# Victor App — Personal Trainer Platform

**Plataforma SaaS completa para personal trainers e seus alunos**

Documento tecnico atualizado — Sessao 17 (2026-03-20)

---

## Visao Geral

O **Victor App** e uma plataforma web full-stack desenvolvida sob medida para personal trainers gerenciarem seus alunos, prescreverem treinos, acompanharem evolucao e monetizarem seus servicos — tudo em um unico sistema com inteligencia artificial integrada.

**Objetivo:** Ser superior ao MFIT, Hevy e concorrentes do mercado fitness, com diferenciais como IA nativa, correcao de postura por camera com replay, corpo 3D anatomico, enciclopedia muscular, e design premium dark mode.

---

## Stack Tecnologica

| Camada | Tecnologia | Versao | Por que |
|--------|-----------|--------|---------|
| **Framework** | Next.js (App Router) | 16.2.0 | O framework React mais avancado do mercado |
| **Linguagem** | TypeScript | 5.x | Tipagem estatica, menos bugs |
| **Runtime** | React | 19.2 | Server Components e streaming |
| **Bundler** | Turbopack | Nativo | 10x mais rapido (Rust) |
| **Banco de Dados** | PostgreSQL | Via Prisma 7.5 | Enterprise-grade |
| **ORM** | Prisma | 7.5.0 | Type-safe, migrations |
| **IA** | Vercel AI SDK | 6.x | Streaming, multi-provider |
| **Postura** | MediaPipe Pose | 0.10.18 | 33 landmarks, client-side |
| **3D** | Sketchfab Embed | iframe | Zero bundle, premium |
| **Auth** | JWT + bcrypt | Custom | Sessoes seguras |
| **UI** | Tailwind CSS | 4.x | Dark mode, responsivo |
| **Graficos** | Recharts | 3.8 | Interativos, mobile-first |
| **Email** | Resend | 6.9 | Transacional, welcome email |
| **Pagamento** | Mercado Pago | 2.12 | Pix, cartao, boleto |
| **Deploy** | Coolify + Vercel | VPS + Edge | Auto-deploy |

---

## Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Paginas/Telas | 30+ |
| Endpoints API | 35+ |
| Modelos de dados | 20+ tabelas |
| Componentes React | 60+ |
| Exercicios no banco | **235** (203 originais + 32 maquinas Ironberg) |
| Exercicios com analise de postura | **194** (50 originais + 144 estendidos) |
| Padroes biomecanicos | **29** padroes |
| Maquinas Ironberg cobertas | **32** (Hammer, Hoist, Nautilus, Life Fitness, Cybex) |
| Modelos 3D Sketchfab | **30** exercicios mapeados |
| Grupos musculares educativos | **13** com enciclopedia completa |
| System prompts IA | 5 (chat, treino, anamnese, engajamento, Victor Virtual) |
| Build time | ~4-6 segundos (Turbopack) |
| Bugs corrigidos (QA) | 86+ em 6 auditorias |

---

## O Que Ja Esta Funcional (COMPLETO)

### 1. Sistema de Autenticacao
- Login/Registro com JWT seguro (httpOnly, secure, sameSite)
- Senhas com hash bcrypt (12 rounds)
- Proxy com protecao de rotas (API + pages)
- Roles: ADMIN e STUDENT
- **Sessao unica**: sessionVersion no JWT — se logar em outro device, o primeiro e kickado
- Sessoes de 7 dias

### 2. Painel Administrativo (Personal Trainer)
- **Dashboard** com metricas real-time (alunos, sessoes, pagamentos, exercicios)
- **CRUD completo de alunos** — cadastro, status, detalhes, restricoes medicas
- **Workout Builder** — montagem de treinos com reorder, supersets, notas, **maquina sugerida**
- **Biblioteca de 235 exercicios** — busca, filtro por musculo, exercicios custom
- **Plano semanal** — atribuir treinos a dias da semana por aluno
- **Planos & Assinaturas** — 3 tiers x 4 duracoes, feature flags, atribuir alunos
- **Financeiro** — dashboard com overview, pagamentos, custos
- **Hub IA** — geracao de treinos, analise anamnese, mensagens engajamento
- **Import MFIT** — importar dados de outros apps
- Navegacao: sidebar desktop + bottom nav mobile

### 3. App do Aluno — Nivel Premium

#### 3.1 Header Social (todas as paginas)
- Avatar estilo Instagram com anel de progresso semanal
- Saudacao personalizada (Bom dia/Boa tarde/Boa noite + nome)
- Progresso semanal (X/Y treinos esta semana)
- Streak badge (semanas consecutivas)
- Notificacoes

#### 3.2 Treino de Hoje (/today)
- Workout player interativo com 5 fases (preview → active → rest → summary → done)
- **Body Focus Area** — badges dos musculos do dia com info educativa ao tocar
- **Botao 3D Musculos** — abre modelo 3D do exercicio (Sketchfab)
- **Maquina sugerida** — "📍 Hammer Strength vermelho, 2ª fileira"
- Timer circular de descanso com SVG animado
- Registro de series (reps, carga, RPE)
- Haptic feedback (vibrate)
- Swipe gestures entre exercicios
- Last session suggestions (cargas anteriores)
- Active session recovery (retoma se fechar o app)

#### 3.3 Evolucao (/evolution)
- **Anatomia 3D** — modelo Ecorche rotavel (Sketchfab embed)
- **Body Map SVG** — corpo humano frente/costas com musculos por intensidade
- **Enciclopedia muscular** — tap no musculo abre bottom sheet educativo:
  - Musculos alvos, sinergistas, antagonistas
  - Pico de contracao, dica do Victor
- **4 stat cards** (sessoes, volume, series, duracao/RPE)
- **Volume chart** (area), **frequencia semanal** (bar), **RPE trend** (area)
- **Exercise progression** — progressao de carga por exercicio (line)
- **Calendar heatmap** — 3 meses de atividade
- **Personal Records** — top 6 PRs com trofeu
- **PDF export** — relatorio imprimivel

#### 3.4 Correcao de Postura (/posture) — FEATURE KILLER
- **MediaPipe Pose** — 33 landmarks, 100% client-side, offline, sem API key
- **194 exercicios** com regras biomecanicas profissionais
- **29 padroes de movimento** (squat, hinge, push, pull, press, curl, machine press, leg press, etc.)
- **32 maquinas Ironberg** (Hammer Strength, Hoist ROC-IT, Nautilus, Life Fitness, Cybex)
- **Texto GRANDE no canvas** — 28-44px, legivel de 2-3 metros
- **Apenas erros/warnings** no overlay (correct = checkmark discreto)
- **Replay pos-exercicio** — ao parar a camera, mostra timeline dos erros
  - Timestamp + correcoes de cada momento
  - Revisa durante o descanso sem interromper timer
  - Serve pro aluno E pro Victor
  - Nao salva automaticamente (privacidade)
- Dual camera (push-up): detecta frontal vs lateral
- Camera frontal padrao + SwitchCamera
- Feature gate: somente plano Elite

#### 3.5 Chat com IA (/chat)
- Streaming real-time
- Bolhas de conversa, typing indicator, auto-scroll
- Welcome message
- Feature gate: Pro/Elite

#### 3.6 Perfil (/profile)
- Avatar, medidas corporais, IMC
- Stats (sessoes, RPE medio, ultimo treino)
- Botao "Ver Planos / Upgrade"

#### 3.7 Comunidade (/community)
- Ranking de alunos (podio top 3)
- Feed de conquistas
- Desafios semanais

#### 3.8 Upgrade (/upgrade)
- Comparacao 3 planos dentro do app
- Destaque postura Elite, CTA WhatsApp

### 4. Landing Page Premium
- Hero com video background cinematografico + parallax
- **Victor Virtual** — chatbot IA publico com streaming
- Depoimentos carousel interativo
- FAQ accordion premium com logos 3D flutuantes
- Cards de plano com CardSpotlight (luz segue o mouse)
- Sticky CTA mobile + garantia 7 dias
- Footer com typing animation motivacional
- Checkout modal com form + redirect MP

### 5. Checkout Mercado Pago
- SDK v2.12, lazy init
- IPN webhook (HMAC-SHA256, idempotente)
- Auto user creation + welcome email (Resend)
- 3 paginas retorno (success/failure/pending)
- Fallback WhatsApp no modal
- **Seguranca**: rejeita webhook sem secret em producao, $transaction atomica

### 6. Email Transacional (Resend)
- Welcome email com login + senha temporaria
- Template HTML dark theme premium
- XSS prevention (escapeHtml)
- Fallback graceful se RESEND_API_KEY nao configurada

### 7. SEO & PWA
- OG Image profissional (1200x630, branded)
- JSON-LD Schema.org, robots.txt, sitemap.xml
- PWA manifest + service worker + install banner
- Security headers (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)

### 8. Modelos 3D Sketchfab (30 exercicios)
- Embed via iframe (zero bundle, lazy loading)
- Exercicios mapeados: Bench Press, Pec Deck, Lat Pulldown, Cable Row,
  T-Bar Row, Pull-Up, Shoulder Press, Hip Thrust, Belt Squat, Leg Press,
  Leg Extension, Abdominal, Dips, Flexao, e mais
- Rotacao touch, pinch zoom, annotations
- Botao "3D Musculos" no workout preview + fullscreen viewer
- Fonte: Mike - Modelo Muscular 3D (CC-BY) + Alexdubob Fitness Collection

---

## O Que Falta (NAO Funcional)

### Pendente — Keys do Victor (2026-03-21)
- [ ] **GOOGLE_AI_API_KEY** — Chat IA, Victor Virtual, geracao treinos (tudo depende disso)
- [ ] **RESEND_API_KEY** — Email transacional (welcome email)
- [ ] **MERCADOPAGO_WEBHOOK_SECRET** — Webhook verificado em producao
- [ ] Apos receber: configurar no .env + Coolify + redeploy

### Pendente — Testes E2E
- [ ] Testar checkout sandbox end-to-end (MP sandbox)
- [ ] Testar login/redirect em producao
- [ ] Testar todas as paginas no Coolify deploy

### Pendente — Producao
- [ ] Trocar credenciais MP teste → producao
- [ ] Comprar dominio (victoroliveiraapersonal.com.br)
- [ ] Apagar contas de teste antes do launch
- [ ] Configurar webhook MP producao

### Futuro — Melhorias
- [ ] Feedback pos-exercicio com video gravado (gravar video + analise)
- [ ] Modo "salvar replay" pra Victor ver remotamente
- [ ] Mais modelos 3D Sketchfab (buscar novos)
- [ ] QR Code por maquina na Ironberg → abre exercicio no app
- [ ] Modulo de nutricao (tracking macros)
- [ ] GIFs animados via ExerciseDB RapidAPI
- [ ] Chat privado Victor ↔ Aluno

---

## Diferenciais Competitivos

| Feature | MFIT | Hevy | Victor App |
|---------|------|------|-----------|
| Geracao de treino por IA | Nao | Nao | **Sim** — 235 exercicios |
| Chat IA pos-treino | Nao | Nao | **Sim** — streaming |
| Analise anamnese por IA | Nao | Nao | **Sim** |
| **Correcao postura camera** | **Nao** | **Nao** | **Sim — 194 exercicios, 29 padroes, replay** |
| **Corpo 3D anatomico** | **Nao** | **Nao** | **Sim — Sketchfab rotavel** |
| **Enciclopedia muscular** | **Nao** | Basico | **Sim — alvos, sinergistas, pico contracao** |
| **Maquinas Ironberg** | **Nao** | **Nao** | **Sim — 32 maquinas com biomec.** |
| **Modelos 3D exercicios** | **Nao** | **Nao** | **Sim — 30 exercicios** |
| Body map visual | Nao | Sim (basico) | **Sim — SVG frente/costas + intensidade** |
| Checkout integrado | Sim | Nao | **Sim — MP (Pix, cartao, boleto)** |
| Email boas-vindas | Basico | Nao | **Sim — Resend, dark theme** |
| Sessao unica (anti-share) | Nao | Nao | **Sim** |
| PWA | Sim | Sim | **Sim** |
| Dark mode premium | Nao | Sim | **Sim — Ironberg theme** |

---

## URLs de Deploy

| Ambiente | URL |
|----------|-----|
| Coolify (VPS) | http://dogkkc0ogsc0sw048w0g0sso.187.77.226.144.sslip.io |
| Vercel | https://victor-app-seven.vercel.app |
| GitHub | https://github.com/l2versus/victor-app |

## Contas de Teste

| Email | Senha | Role |
|-------|-------|------|
| victor@teste.com | 123456 | Admin |
| emmanuel@teste.com | admin123 | Aluno Elite |
| aluno@teste.com | 123456 | Aluno sem plano |
