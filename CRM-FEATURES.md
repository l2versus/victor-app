# Victor App — CRM Features (v2.0)

> Documentação comercial de features para pitch de venda e valor de mercado.
> Última atualização: 2026-03-23

---

## Visão Geral

O Victor App CRM é um sistema completo de gestão de leads com **captura automática multi-canal**, **IA de scoring**, **bot WhatsApp humanizado** e **analytics de funil** — tudo integrado ao ecossistema de treino do aluno.

**Diferenciais competitivos**:
- CRM + App de treino no mesmo sistema (lead → aluno → acompanhamento)
- WhatsApp integrado via QR code (sem API oficial cara da Meta)
- IA classifica leads automaticamente (sem trabalho manual)
- Bot pós-treino que finge ser o trainer (humanizado)
- Captura automática de visitantes do site

---

## Features por Módulo

### 1. Pipeline Kanban
- 6 colunas: Novos → Contactados → Experimental → Negociando → Convertidos → Perdidos
- **Drag & drop** mouse + touch (mobile-friendly)
- Filtro por temperatura (Quente/Morno/Frio)
- Busca por nome com debounce
- Valor total do pipeline em tempo real
- Tags personalizáveis por lead

### 2. Captura Automática de Leads (5 canais)

| Canal | Como funciona | Temperatura |
|-------|---------------|-------------|
| **WhatsApp** | Número desconhecido manda msg → auto-cria lead + resposta inteligente | Auto-classificada |
| **Landing Page** | Form "Quero experimentar" (nome + WhatsApp) → lead WARM | WARM |
| **Abandono Checkout** | Visitante preenche dados mas não paga → lead HOT + valor do plano | HOT |
| **Chat Widget** | Após 3 msgs no chat, pede contato → lead WARM + histórico do chat | WARM |
| **Webhook Público** | ManyChat, Zapier, Make, n8n → `POST /api/webhooks/crm?token=xxx` | Configurável |

### 3. WhatsApp Integration (Evolution API)
- **Conexão via QR Code** — escaneia e conecta em 30 segundos
- **Sem custos Meta Business** — usa Evolution API (self-hosted ou cloud)
- **Auto-captura de leads** — número novo = lead no CRM
- **Auto-reply inteligente** — detecta intenção (preço, experimental, emagrecer, massa) e responde de forma personalizada
- **Menu interativo** — manda opções numeradas pro lead escolher
- **Classificação automática** — lead que pergunta preço = HOT
- **Fallback Meta Cloud API** — se Evolution falha, tenta Meta como backup

### 4. AI Lead Scoring
- **Score 0-100** baseado em 5 fatores:
  - Frequência de contato (25%)
  - Recência do último contato (25%)
  - Valor potencial R$/mês (20%)
  - Qualidade da fonte (15%)
  - Posição no pipeline (15%)
- **Temperatura automática**: score ≥ 60 = HOT, ≥ 30 = WARM, < 30 = COLD
- **Score automático**: roda quando lead é criado, recebe mensagem, ou muda de status
- **Notificação "Lead quente!"**: Victor recebe alerta quando lead fica HOT
- **Labels**: Muito Quente, Quente, Morno, Frio, Gelado

### 5. Bot Pós-Treino
- Aluno completa sessão no app → **30 a 90 minutos depois** → WhatsApp como se fosse o Victor
- 5 mensagens variadas aleatórias (não parece bot)
- Pergunta como foi o treino, se sentiu algo, pede feedback
- Salva resposta no banco como DirectMessage
- Victor vê tudo no painel de mensagens

### 6. Dashboard Analytics
- **KPIs**: total leads, ativos, convertidos, perdidos, taxa conversão, novos 7d
- **Funil de conversão**: NEW → CONTACTED → TRIAL → NEGOTIATING → CONVERTED com % de avanço
- **Captura semanal**: gráfico de barras (últimas 4 semanas)
- **Receita pipeline**: valor ativo vs convertido
- **Distribuição de temperatura**: HOT/WARM/COLD com barras visuais
- **Leads por fonte**: ranking de canais que mais geram leads
- **Top 5 leads**: por score, com temperatura e valor
- **Timeline de atividades**: últimas 20 ações no CRM

### 7. Inbox (Conversas)
- Lista de conversas com leads (abertas/fechadas)
- Mensagens em tempo real
- Assign conversa pra membro da equipe
- Mark as read automático
- Status: OPEN → CLOSED → ARCHIVED

### 8. Broadcasts (Envio em Massa)
- Criar campanha com nome e conteúdo
- Filtros: status, temperatura, tags, score mínimo
- Preview de destinatários antes de enviar
- Substituição de variáveis: `{{nome}}`, `{{nome_completo}}`
- Status: DRAFT → SENDING → COMPLETED/FAILED
- Tracking: enviados, falhos, por destinatário
- Envio real via WhatsApp (Evolution ou Meta)

### 9. Templates de Mensagem
- CRUD de templates reutilizáveis
- Tipos: WhatsApp, Email, SMS
- Detecção automática de variáveis `{{var}}`
- Categorias organizáveis

### 10. Webhooks de Entrada
- Criar webhooks com token único
- Ações: create_lead, update_lead, custom
- Aceita payloads de ManyChat, Zapier, Make, n8n
- Mapeamento flexível de campos
- Logs de execução (success/error)
- Rate limit: 60 req/min

### 11. Automações (Bot Flows)
- Templates prontos: boas-vindas, pós-treino, re-engajamento, recuperação
- Triggers: novo lead, keyword, mudança de status
- Ativar/desativar com toggle
- Visual: nodes + edges (preparado pra flow builder)

### 12. Integrações
- **Evolution API** (WhatsApp via QR code)
- **Meta Cloud API** (WhatsApp oficial, fallback)
- **Webhook universal** (ManyChat, Zapier, Make, n8n, qualquer sistema)
- **Groq AI** (Llama 3.3 70B) — bot de vendas pra leads + respostas humanizadas pra alunos (14.400 req/dia grátis)
- **Mercado Pago** — checkout integrado com captura de abandono

---

## Métricas de Qualidade

| Métrica | Valor |
|---------|-------|
| Arquivos CRM | 22 routes + 4 libs + 1 frontend |
| Models Prisma | 10 (Lead, FollowUp, Activity, Template, Webhook, WebhookLog, Conversation, Message, Broadcast, BotFlow) |
| Endpoints API | 15 routes |
| Bugs corrigidos | 18 (4 CRITICAL, 6 HIGH, 8 MEDIUM) |
| Canais de captura | 5 (WhatsApp, Landing, Checkout, Chat, Webhook) |
| TypeScript errors | 0 |
| Mobile-ready | Touch drag & drop, tabs responsivas |

---

## Comparativo de Mercado

| Feature | Victor App | MFIT | Gympass CRM | Tecnofit |
|---------|-----------|------|-------------|----------|
| CRM integrado ao app | ✅ | ❌ | ❌ | Parcial |
| WhatsApp via QR code | ✅ | ❌ | ❌ | ❌ |
| AI Lead Scoring | ✅ | ❌ | ❌ | ❌ |
| Bot pós-treino | ✅ | ❌ | ❌ | ❌ |
| Auto-reply inteligente | ✅ | ❌ | ❌ | ❌ |
| Captura abandono checkout | ✅ | ❌ | ❌ | ❌ |
| Chat widget → lead | ✅ | ❌ | ❌ | ❌ |
| Funil de conversão | ✅ | Básico | ✅ | ✅ |
| Broadcast WhatsApp | ✅ | ❌ | ❌ | ❌ |
| Webhook universal | ✅ | ❌ | ❌ | Parcial |
| Postura IA (MediaPipe) | ✅ | ❌ | ❌ | ❌ |
| 3D Machine Viewer | ✅ | ❌ | ❌ | ❌ |

---

## Valor para o Pitch

### Para Personal Trainers (B2C)
> "Seu CRM já captura leads automaticamente do WhatsApp, do seu site, e até de quem abandona o checkout. A IA classifica quem tá quente pra tu focar no que importa. E o bot manda WhatsApp pros teus alunos depois do treino como se fosse tu."

### Para Academias (B2B White-Label)
> "CRM completo com captura multi-canal, scoring IA, funil de conversão e WhatsApp integrado via QR. Zero custo de API Meta. Tudo no mesmo sistema do app de treino — lead vira aluno sem sair do sistema."

### Números que vendem
- **5 canais** de captura automática de leads
- **0 trabalho manual** — scoring, temperatura e notificação são automáticos
- **30 segundos** pra conectar WhatsApp (QR code)
- **R$ 0/mês** em API WhatsApp (Evolution API self-hosted)
- **15 endpoints** de API pra integrações externas
