# Victor App — Fluxos n8n (Zero Token)

> Todos os fluxos abaixo são lógica pura — SEM IA, SEM tokens, SEM custo.
> O único que usa IA é o auto-reply (Groq Llama 3.3 = GRÁTIS, 14.400 req/dia).

---

## FLUXO 1: Lead Captura WhatsApp → CRM
**Trigger:** Webhook (Evolution API envia POST quando msg chega)
**Custo:** R$ 0

```
[Evolution API Webhook]
  → [IF] Número existe no CRM?
    → SIM: Atualizar lastMessageAt, criar CrmActivity
    → NÃO: Criar Lead (name: número, phone: formatado, source: WHATSAPP, temperature: WARM)
  → [Webhook Response] POST /api/webhooks/crm
    → Body: { name, phone, source: "WHATSAPP", notes: "Capturado via n8n" }
```

**n8n Nodes:**
1. Webhook Trigger (POST /webhook/whatsapp)
2. HTTP Request → GET /api/admin/crm/leads?phone={{phone}} (checar duplicata)
3. IF → lead existe?
4. HTTP Request → POST /api/webhooks/crm?token=xxx (criar lead)
5. HTTP Request → POST /api/admin/crm/leads/{{id}}/activity (registrar atividade)

---

## FLUXO 2: Lead Scoring Automático
**Trigger:** Schedule (a cada 1 hora)
**Custo:** R$ 0

```
[Schedule Trigger] A cada 1h
  → [HTTP Request] GET /api/admin/crm/leads?status=NEW,CONTACTED,TRIAL,NEGOTIATING
  → [Loop] Para cada lead:
    → Calcular score baseado em regras:
      - Tem WhatsApp? +20
      - Respondeu última msg? +15
      - Perguntou preço? +25
      - Fonte = WEBSITE? +10
      - Última interação < 3 dias? +15
      - Última interação > 7 dias? -20
    → [IF] Score >= 60? → Temperature = HOT
    → [IF] Score 30-59? → Temperature = WARM
    → [IF] Score < 30? → Temperature = COLD
    → [HTTP Request] PATCH /api/admin/crm/leads/{{id}} { score, temperature }
```

---

## FLUXO 3: Lead Inativo → Degradar para COLD
**Trigger:** Schedule (diário, 8h da manhã)
**Custo:** R$ 0

```
[Schedule Trigger] Diário 08:00
  → [HTTP Request] GET /api/admin/crm/leads?temperature=WARM,HOT
  → [Filter] Última interação > 7 dias
  → [Loop] Para cada lead inativo:
    → PATCH /api/admin/crm/leads/{{id}} { temperature: "COLD" }
    → POST /api/admin/crm/leads/{{id}}/activity { type: "NOTE", content: "Degradado para COLD - 7 dias sem interação" }
```

---

## FLUXO 4: Notificar Victor → Lead HOT
**Trigger:** Webhook (quando lead muda para HOT)
**Custo:** R$ 0

```
[Webhook Trigger] POST /webhook/lead-hot
  → [IF] temperature === "HOT"
    → [WhatsApp] Enviar msg pro Victor:
      "🔥 LEAD QUENTE: {{name}} ({{phone}})
       Score: {{score}}/100
       Fonte: {{source}}
       Última msg: {{lastMessage}}"
```

---

## FLUXO 5: Abandono de Checkout → Lead HOT
**Trigger:** Webhook (frontend envia beacon quando fecha modal sem pagar)
**Custo:** R$ 0

```
[Webhook Trigger] POST /webhook/checkout-abandon
  → [HTTP Request] POST /api/webhooks/crm?token=xxx
    Body: {
      name: {{name}},
      phone: {{phone}},
      source: "WEBSITE",
      temperature: "HOT",
      tags: ["abandono_checkout"],
      notes: "Abandonou checkout do plano {{planName}} (R$ {{value}})",
      value: {{planValue}}
    }
  → [WhatsApp] Enviar msg pro Victor:
    "💰 ABANDONO: {{name}} quase comprou o plano {{planName}}!"
```

---

## FLUXO 6: Bot Pós-Treino (substitui setTimeout)
**Trigger:** Webhook (backend chama quando aluno completa sessão)
**Custo:** R$ 0 (msg pré-definida, sem IA)

```
[Webhook Trigger] POST /webhook/post-workout
  → [Wait] 45 minutos (n8n nativo, sem código)
  → [Switch] Random 1-5 (variar mensagens)
    → Msg 1: "E aí, {{name}}! Como foi o treino de hoje? 💪"
    → Msg 2: "{{name}}, treino concluído! Descansa bem 🔥"
    → Msg 3: "Mandou bem no treino, {{name}}! Amanhã tem mais 💪"
    → Msg 4: "{{name}}! Treino finalizado. Como se sente? 😎"
    → Msg 5: "Boa, {{name}}! {{exerciseCount}} exercícios feitos! 🏆"
  → [HTTP Request] POST Evolution API sendMessage
    { number: {{phone}}, text: {{selectedMsg}} }
```

---

## FLUXO 7: ManyChat → CRM (Instagram DMs)
**Trigger:** Webhook (ManyChat envia POST)
**Custo:** R$ 0

```
[Webhook Trigger] POST /webhook/manychat
  → [Extract] first_name, phone, email do payload ManyChat
  → [HTTP Request] POST /api/webhooks/crm?token=xxx
    Body: {
      name: {{first_name}},
      phone: {{phone}},
      email: {{email}},
      source: "INSTAGRAM",
      tags: ["manychat"],
      notes: "Capturado via ManyChat Instagram DM"
    }
```

---

## FLUXO 8: Follow-up Automático (3 dias sem resposta)
**Trigger:** Schedule (diário, 10h)
**Custo:** R$ 0

```
[Schedule Trigger] Diário 10:00
  → [HTTP Request] GET /api/admin/crm/leads?status=CONTACTED&temperature=WARM,HOT
  → [Filter] Última msg > 3 dias E última msg < 7 dias
  → [Loop] Para cada lead:
    → [Switch] Baseado em temperatura:
      → HOT: "Oi {{name}}! Vi que ficou interessado. Quer agendar um treino experimental? 🏋️"
      → WARM: "{{name}}, tudo bem? Ainda pensando em começar a treinar? 💪"
    → [HTTP Request] POST Evolution API sendMessage
    → PATCH /api/admin/crm/leads/{{id}} { status: "CONTACTED" }
    → POST /api/admin/crm/leads/{{id}}/activity { type: "WHATSAPP", content: "Follow-up automático" }
```

---

## Setup no n8n

### Variáveis de ambiente necessárias:
```
VICTOR_APP_URL=https://victor-app-seven.vercel.app
CRM_WEBHOOK_TOKEN=xxx (pegar em /admin/crm → Webhooks)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=xxx
EVOLUTION_INSTANCE=victor
VICTOR_PHONE=5585999999999
```

### Endpoints do Victor App que o n8n usa:
| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | /api/webhooks/crm?token=xxx | Token na URL | Criar lead |
| GET | /api/admin/crm/leads | JWT cookie | Listar leads |
| PATCH | /api/admin/crm/leads/[id] | JWT cookie | Atualizar lead |
| POST | /api/admin/crm/leads/[id]/activity | JWT cookie | Registrar atividade |

### ManyChat Config:
1. ManyChat → Settings → External Requests
2. POST para: {{VICTOR_APP_URL}}/api/webhooks/crm?token={{CRM_WEBHOOK_TOKEN}}
3. Mapear: first_name → name, phone → phone, email → email
4. Adicionar custom field: source = "INSTAGRAM"
