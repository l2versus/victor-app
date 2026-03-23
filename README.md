# Victor App — Plataforma de Personal Trainer com IA

> Sistema completo de gestão de treinos para personal trainers, com inteligência artificial, análise postural por câmera, máquinas 3D interativas e integração WhatsApp.

## Diferenciais Exclusivos

| Feature | Descrição |
|---------|-----------|
| **Correção Postural IA** | MediaPipe Pose Landmarker analisa 256 exercícios em tempo real pela câmera do celular |
| **52 Máquinas 3D Ironberg** | Modelos interativos Three.js de máquinas reais de academia |
| **Prescrição por Voz** | Personal fala o treino, IA monta a ficha automaticamente |
| **IA Dual (Gemini + Claude)** | Chat inteligente com contexto completo do aluno (treinos, nutrição, body scan) |
| **Body Scan IA** | Análise de shape corporal (frente + lateral) com ratios e score postural |
| **Spotify no Treino** | Integração OAuth — aluno treina ouvindo suas playlists |
| **Broadcast WhatsApp + IA** | Mensagens em massa com texto gerado por IA, filtros por gênero/idade/status |

## Stack Técnica

- **Frontend:** Next.js 16 + React 19 + TailwindCSS + Framer Motion
- **Backend:** Next.js API Routes + Prisma ORM + PostgreSQL
- **IA:** Claude Sonnet (premium) + Gemini Flash (free) — dual model architecture
- **3D:** Three.js + Sketchfab (.glb models)
- **Postura:** MediaPipe Pose Landmarker (on-device, real-time, 33 landmarks)
- **Pagamentos:** Mercado Pago (PIX, cartão, boleto) + webhooks automáticos
- **Notificações:** Web Push (VAPID) + WhatsApp Cloud API (Meta)
- **Email:** Resend (transacional)
- **Auth:** JWT httpOnly + bcrypt + sessão única por device
- **Deploy:** Coolify (self-hosted) / Vercel

## Funcionalidades

### Para o Aluno (PWA Mobile-First)
- Treino do dia com seletor de dias da semana
- Exercícios com instruções, thumbnails, vídeos (YouTube/Instagram/MP4)
- Player de treino com timer de descanso, RPE, técnicas avançadas (Drop Set, FST-7, Myo-Reps, etc.)
- Histórico de sessões com evolução de cargas
- Análise postural por câmera em tempo real
- Body Scan (shape detection, ratios corporais, score postural)
- Chat IA com contexto completo (treino, nutrição, scan, histórico)
- Nutrição com tracking de macros e sugestões IA
- Comunidade com ranking, feed e desafios
- Fotos de progresso com categorias
- Agenda de sessões presenciais
- Spotify mini player durante o treino
- Notificações push em tempo real

### Para o Personal Trainer (Admin Dashboard)
- Dashboard com KPIs (alunos, sessões, receita, custos)
- Gestão completa de alunos (CRUD, perfil, restrições médicas)
- Criação de treinos com 285 exercícios + drag-and-drop
- Prescrição por voz (Web Speech + IA)
- Atribuição semanal de treinos (7 dias)
- Visão do aluno (phone mockup interativo)
- Evolução de cargas por exercício (gráficos Recharts)
- Download PDF do treino
- Templates prontos (biblioteca com filtros)
- Planos e pricing (3 tiers × 4 durações)
- Financeiro (receita, custos, lucro, métodos de pagamento)
- Cobranças automáticas com lembretes
- Mensagens diretas 1:1 com alunos
- Broadcast em massa (IA + filtros + WhatsApp/Push/App)
- Automações WhatsApp (lembretes, aniversários, inativos, cobrança)
- Avaliações (anamnese, dobras cutâneas Pollock 7, PAR-Q)
- Desafios com leaderboard
- BI de treino (analytics)
- Check-in de presença
- CRM de leads
- Import de dados do MFIT

### Integrações
- **Mercado Pago** — Checkout completo com webhook (PIX, cartão, boleto)
- **WhatsApp Cloud API** — Bot IA + broadcast + lembretes automáticos
- **Spotify** — OAuth + playlists + mini player
- **Resend** — Email de boas-vindas com credenciais temporárias
- **Ironberg** — 52 máquinas com modelos 3D interativos

## Modelo de Pricing (B2C — Personal → Aluno)

| Plano | Mensal | Trimestral (-15%) | Semestral (-25%) | Anual (-40%) |
|-------|--------|-------------------|------------------|-------------|
| **Essencial** | R$ 199,90 | R$ 169,92/mês | R$ 149,93/mês | R$ 119,94/mês |
| **Pro** | R$ 299,90 | R$ 254,92/mês | R$ 224,93/mês | R$ 179,94/mês |
| **Elite** | R$ 499,90 | R$ 424,92/mês | R$ 374,93/mês | R$ 299,94/mês |

**Essencial:** App + histórico + 3x/semana
**Pro:** + IA chat + treinos ilimitados + análise inteligente
**Elite:** + Postura IA + Nutrição + Grupo VIP + WhatsApp direto

## Proposta White-Label para Academias (B2B — Ironberg)

O Victor App pode ser oferecido como plataforma white-label para redes de academias:

| Plano | Para quem | Preço sugerido |
|-------|-----------|---------------|
| **Starter** | Academia pequena (1 personal) | R$ 297/mês |
| **Pro** | Academia média (até 5 personais) | R$ 797/mês |
| **Enterprise** | Redes de academias | Sob consulta |

### Diferenciais para academias:
- **QR Code nas máquinas** → aluno escaneia e vê exercícios + 3D + postura IA
- **Multi-tenant** → cada personal tem seu painel, academia tem visão geral
- **Marca própria** → logo e cores da academia
- **Recorrência** → transforma venda de equipamento em SaaS

## Setup Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, etc.

# Gerar Prisma Client
npx prisma generate

# Rodar migrations
npx prisma db push

# Seed de exercícios + planos
npx tsx prisma/seed.ts
npx tsx prisma/seed-plans.ts

# Dev server
npm run dev
```

## Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgres://..."

# Auth
JWT_SECRET="..."

# IA
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIzaSy..."

# Pagamentos
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-..."
MERCADOPAGO_WEBHOOK_SECRET="..."

# URLs
APP_URL="https://..."
NEXT_PUBLIC_APP_URL="https://..."

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:..."

# Email
RESEND_API_KEY="re_..."

# Spotify
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."

# WhatsApp (Meta Cloud API)
WHATSAPP_TOKEN="..."
WHATSAPP_PHONE_ID="..."
WHATSAPP_VERIFY_TOKEN="..."
```

## Contato

- **Personal:** Victor Oliveira — @victoroliveiraapersonal_
- **Dev:** Emmanuel — GitHub: l2versus
- **Localização:** Fortaleza/CE, Brasil
