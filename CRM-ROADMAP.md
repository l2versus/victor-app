# CRM Roadmap — Victor App

> Auditoria QA + Plano de implementação
> Gerado: 2026-03-23 | Tech Lead: Claude (QA + Dev + Negócio)

---

## Status Geral

| Área | Status | Nota |
|------|--------|------|
| Pipeline Kanban | OK | Drag & drop funciona (mouse only) |
| CRUD Leads | OK | Falta validação de input |
| AI Scoring | BROKEN | Import quebrado |
| Dashboard | OK | Falta funil de conversão |
| Inbox/Conversas | BUGGY | Prisma orderBy inválido |
| Broadcasts | BUGGY | Pula estado SENDING |
| Templates | OK | Regex de variáveis fraco |
| Webhooks | OK | Token exposto na UI |
| Automações/Bots | OK | - |
| WhatsApp QR | OK | Tab funciona |
| Bot Pós-Treino | UNRELIABLE | setTimeout não sobrevive restart |
| Captura Landing | MISSING | Visitante que não compra = perdido |
| Error Handling UI | MISSING | Todos os catch são `/* ignore */` |
| Mobile Touch D&D | MISSING | Kanban não funciona no celular |

---

## FASE 1 — Bugs CRITICAL (quebra em produção)

### 1.1 Fix import do Score
- [ ] `src/app/api/admin/crm/score/route.ts` — trocar `@/generated/prisma/client` por `@prisma/client`
- [ ] Verificar se `LeadTemperature` é exportado corretamente

### 1.2 Fix `restrictions` JSON no bot
- [ ] `src/lib/whatsapp-bot.ts:201` — `restrictions` é `Json?`, não `string`
- [ ] Fazer: `typeof restrictions === 'string' ? restrictions : JSON.stringify(restrictions)`

### 1.3 Fix `LeadFollowUp.type: "WEBHOOK"`
- [ ] `src/app/api/webhooks/crm/route.ts:98` — tipo `"WEBHOOK"` não existe no schema
- [ ] Trocar por `"NOTE"` ou adicionar `"WEBHOOK"` como tipo válido no comentário do schema

### 1.4 Fix Prisma orderBy inválido (conversations)
- [ ] `src/app/api/admin/crm/conversations/route.ts` — `{ sort: "desc", nulls: "last" }` não existe
- [ ] Trocar por `{ lastMessageAt: "desc" }`

---

## FASE 2 — Bugs HIGH (funciona errado)

### 2.1 Criar helper de normalização de telefone
- [ ] Criar `src/lib/phone.ts` com função única `normalizePhone(raw: string): string`
- [ ] Regras: remover +, espaços, hifens; garantir 55 na frente; sem duplicar 55
- [ ] Substituir em TODOS os arquivos:
  - [ ] `src/lib/whatsapp-bot.ts` (linha 115)
  - [ ] `src/lib/evolution-api.ts` (linha 109)
  - [ ] `src/app/api/webhooks/crm/route.ts` (linha 63)
  - [ ] `src/app/api/webhooks/whatsapp/route.ts`
  - [ ] `src/app/api/webhooks/evolution/route.ts`
  - [ ] `src/app/api/student/sessions/[id]/route.ts` (post-workout bot)

### 2.2 Fix trainer query sem WHERE
- [ ] `src/app/api/webhooks/evolution/route.ts` linhas 71, 132
- [ ] `src/app/api/webhooks/whatsapp/route.ts` linhas 68, 113
- [ ] Solução: buscar trainer por configuração ou pegar o único existente com validação

### 2.3 Fix broadcast pula SENDING
- [ ] `src/app/api/admin/crm/broadcasts/route.ts`
- [ ] Fluxo correto: DRAFT → SENDING → (loop envia) → COMPLETED/FAILED
- [ ] Setar `status: "SENDING"` antes do loop, `"COMPLETED"` depois

### 2.4 Fix error handling frontend
- [ ] `src/app/(admin)/admin/crm/crm-client.tsx`
- [ ] Trocar TODOS os `catch { /* ignore */ }` por toast de erro
- [ ] Criar componente `toast()` simples ou usar state de erro
- [ ] Mínimo: `catch (err) { setError("Falha ao carregar dados") }`

### 2.5 Fix form validation
- [ ] Validar email com regex básico
- [ ] Validar telefone: só números, mín 10 dígitos
- [ ] Validar valor: número positivo
- [ ] Mostrar erros inline no form

---

## FASE 3 — Mobile & UX

### 3.1 Touch drag & drop no kanban
- [ ] Substituir HTML5 drag por `@dnd-kit/core` ou implementar touch events
- [ ] Testar em iPhone e Android

### 3.2 Tab state na URL
- [ ] Quando trocar tab, atualizar URL: `router.push(\`?tab=\${newTab}\`, { scroll: false })`
- [ ] Tab "WhatsApp" acessível de Configurações (já feito)

### 3.3 Debounce no search
- [ ] `src/app/(admin)/admin/crm/crm-client.tsx` linha 155
- [ ] 300ms debounce no searchQuery antes de chamar API

### 3.4 Paginação nas listas
- [ ] Conversations: carregar 20 por vez, "carregar mais"
- [ ] Broadcasts: paginação
- [ ] Activities no dashboard: limitar a 10 + "ver mais"

---

## FASE 4 — Fluxos de Captura de Leads

### 4.1 Landing page — formulário "Quero experimentar"
- [ ] Adicionar seção na landing page com form simples: nome + WhatsApp
- [ ] POST para `/api/leads/capture` (público, sem auth)
- [ ] Cria lead como `WARM` + source `WEBSITE`
- [ ] Redireciona pra "Obrigado! Victor vai te chamar"
- [ ] Notifica admin

### 4.2 Abandono de checkout
- [ ] Na landing page, salvar dados do form de checkout em `sessionStorage`
- [ ] Se o usuário preencheu nome+telefone mas não completou pagamento:
  - [ ] Enviar beacon ou fetch pra `/api/leads/capture` com tag `"abandono_checkout"`
  - [ ] Lead criado como `HOT` + valor do plano selecionado
  - [ ] Source: `WEBSITE`

### 4.3 Chat widget → captura de lead
- [ ] Após 2 mensagens no chat widget da landing:
  - [ ] Pedir nome e WhatsApp
  - [ ] Se forneceu, criar lead `WARM` + source `WEBSITE`
  - [ ] Salvar histórico do chat nas `notes` do lead

### 4.4 Auto-reply inteligente para leads WhatsApp
- [ ] Quando lead novo chega via WhatsApp (Evolution/Meta):
  - [ ] Resposta atual: genérica "Sou o Victor, vou te responder"
  - [ ] Melhorar: perguntar "Qual seu objetivo? Emagrecer, ganhar massa, condicionamento?"
  - [ ] Baseado na resposta, setar `tags` e `temperature` automaticamente
  - [ ] Se mencionou preço/valor → `HOT`

### 4.5 API pública para captura (`/api/leads/capture`)
- [ ] Endpoint público com rate limit
- [ ] Aceita: `name`, `phone`, `email`, `source`, `tags`, `notes`, `value`
- [ ] Detecta duplicata por telefone
- [ ] Retorna `{ success: true, leadId }`
- [ ] Usado por: landing page, chat widget, abandono checkout, forms externos

---

## FASE 5 — Inteligência & Automação

### 5.1 Score automático
- [ ] Rodar score quando: lead criado, mensagem recebida, status mudou
- [ ] Não depender de botão manual
- [ ] Score > 70 → notificar Victor "Lead quente!"

### 5.2 Funil de conversão no dashboard
- [ ] Calcular: % NEW→CONTACTED, CONTACTED→TRIAL, TRIAL→NEGOTIATING, NEGOTIATING→CONVERTED
- [ ] Gráfico de funil visual
- [ ] Tempo médio em cada etapa

### 5.3 Bot pós-treino mais confiável
- [ ] Trocar `setTimeout` por cron job ou fila
- [ ] Opção 1: salvar na tabela `PendingBotMessage` e processar via `/api/cron/bot-messages`
- [ ] Opção 2: usar `waitUntil` do Next.js (se Coolify suportar long-running)
- [ ] Adicionar flag `whatsappOptIn` no Student pra respeitar opt-out

### 5.4 Classificação automática de temperatura
- [ ] Lead sem interação 7+ dias → COLD
- [ ] Lead respondeu última msg → WARM
- [ ] Lead perguntou preço/agendou visita → HOT
- [ ] Rodar via cron diário

---

## FASE 6 — Integrações Externas

### 6.1 ManyChat
- [ ] Criar webhook no CRM (tab Webhooks)
- [ ] Copiar URL do webhook
- [ ] No ManyChat: Action → External Request → colar URL
- [ ] Campo mapping: `first_name`, `phone`, `email` → campos do lead
- [ ] Já funciona via `/api/webhooks/crm?token=xxx`

### 6.2 Instagram DM (via ManyChat)
- [ ] ManyChat captura DM do Instagram
- [ ] Envia pra webhook CRM com `source: "INSTAGRAM"`
- [ ] Lead criado automaticamente

### 6.3 Facebook Lead Ads
- [ ] Zapier/Make: trigger "New Lead in Facebook Lead Ads"
- [ ] Action: webhook POST pra CRM
- [ ] Mapeamento: nome, telefone, email, interesse

### 6.4 TikTok Lead Gen
- [ ] Mesmo fluxo que Facebook via Zapier/Make
- [ ] Source: `TIKTOK`

### 6.5 Google Ads (Click to WhatsApp)
- [ ] Lead chega via WhatsApp → já capturado automaticamente
- [ ] Adicionar UTM tracking pra identificar source = Google Ads
- [ ] Tag automática: `google_ads`

---

## FASE 7 — Segurança & Qualidade

### 7.1 Token de webhook mascarado
- [ ] Na UI de webhooks, mostrar apenas últimos 4 chars
- [ ] Botão "Copiar URL completa" (já existe)
- [ ] Nunca expor token completo no HTML

### 7.2 Rate limit nos webhooks públicos
- [ ] `/api/webhooks/crm` — máx 60 req/min por IP
- [ ] `/api/webhooks/evolution` — máx 120 req/min
- [ ] `/api/leads/capture` — máx 10 req/min por IP

### 7.3 Soft delete
- [ ] Leads deletados → setar `deletedAt` ao invés de `DELETE`
- [ ] Filtrar `deletedAt: null` em todas as queries
- [ ] Admin pode restaurar lead deletado

### 7.4 Audit log
- [ ] Toda ação no CRM cria `CrmActivity`
- [ ] Verificar que PATCH (update), DELETE, e webhook updates logam atividade
- [ ] Dashboard mostra timeline completa

---

## Prioridade de Execução

```
FASE 1 (CRITICAL)     → ████████████ 1-2 horas
FASE 2 (HIGH)         → ████████████████ 2-3 horas
FASE 3 (Mobile/UX)    → ████████████ 2 horas
FASE 4 (Captura)      → ████████████████████ 3-4 horas  ← MAIOR IMPACTO NO NEGÓCIO
FASE 5 (Inteligência) → ████████████████ 2-3 horas
FASE 6 (Integrações)  → ████████ 1-2 horas (configs, não código)
FASE 7 (Segurança)    → ████████ 1-2 horas
```

**Recomendação de negócio**: FASE 4 (Captura de Leads) deveria vir logo após FASE 1+2, porque sem captura automática, o CRM é inútil — leads só entram manualmente ou via WhatsApp de números desconhecidos.

---

## Checklist Rápido (pra marcar durante implementação)

- [x] FASE 1 completa — bugs critical corrigidos (2026-03-23)
- [x] FASE 2 completa — bugs high corrigidos (2026-03-23)
- [x] FASE 3 completa — mobile + UX (2026-03-23)
- [x] FASE 4 completa — captura de leads funcionando (2026-03-23)
- [x] FASE 5 completa — AI + automação (2026-03-23)
- [ ] FASE 6 completa — integrações externas (config, não código)
- [ ] FASE 7 completa — segurança + qualidade
- [ ] QA final — testar todos os fluxos end-to-end
- [ ] Deploy produção
