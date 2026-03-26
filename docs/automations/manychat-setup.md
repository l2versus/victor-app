# ManyChat → Victor App CRM — Setup Completo

## Pré-requisitos
- Conta ManyChat Pro (ou Free com limitações)
- Instagram Business conectado ao ManyChat
- Victor App rodando com CRM ativo
- Token do webhook CRM (copiar em /admin/crm → Webhooks)

---

## Passo 1: Criar Flow no ManyChat

### Trigger: Palavra-chave no Instagram DM
1. ManyChat → Automation → + New Flow
2. Trigger: "Instagram DM" → Keyword
3. Keywords: `treino`, `personal`, `academia`, `emagrecer`, `hipertrofia`, `TREINO`

### Ação 1: Resposta automática (SEM IA, SEM token)
```
Mensagem:
"Oi {{first_name}}! 👋

Sou o assistente do Victor Oliveira, personal trainer da Ironberg.

O que você procura?
1️⃣ Emagrecer
2️⃣ Ganhar massa muscular
3️⃣ Condicionamento físico
4️⃣ Falar com o Victor

Responda com o número!"
```

### Ação 2: Quick Reply (botões)
- Botão "Emagrecer" → Tag: objetivo_emagrecer
- Botão "Massa" → Tag: objetivo_hipertrofia
- Botão "Condicionamento" → Tag: objetivo_condicionamento
- Botão "Falar com Victor" → Tag: prioridade_alta

### Ação 3: Pedir contato (após escolha)
```
"Perfeito! Para o Victor montar seu plano personalizado, preciso de:

📱 Seu WhatsApp (com DDD)

Exemplo: 85999998888"
```

### Ação 4: External Request → CRM
- Quando usuário envia o número:
- Action → External Request
- Method: POST
- URL: `https://victor-app-seven.vercel.app/api/webhooks/crm?token=SEU_TOKEN`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "name": "{{first_name}} {{last_name}}",
  "phone": "{{last_user_input}}",
  "email": "{{email}}",
  "source": "INSTAGRAM",
  "tags": ["manychat", "{{objetivo_tag}}"],
  "notes": "Via ManyChat Instagram. Objetivo: {{objetivo_tag}}"
}
```

### Ação 5: Confirmação
```
"Pronto, {{first_name}}! ✅

O Victor vai te chamar no WhatsApp em breve.

Enquanto isso, conheça os planos:
🔗 https://victor-app-seven.vercel.app/#planos"
```

---

## Passo 2: Flow "Comentou TREINO no post"

### Trigger: Instagram Comment
1. Trigger: "Instagram Comment" → Keyword: `TREINO`, `treino`, `quero`
2. Ação: Enviar DM automático (mesmo flow acima)
3. O lead é capturado pela DM, não pelo comentário

### Post do Victor:
```
"Comenta TREINO que eu te mando o plano personalizado! 💪🔥"
```

---

## Passo 3: Flow "Story Reply"

### Trigger: Instagram Story Reply
1. Trigger: Story Reply (qualquer resposta ao story)
2. Ação: Mesma sequência — perguntar objetivo → pedir WhatsApp → enviar pro CRM

---

## Custo Total: R$ 0 em tokens de IA
- ManyChat Free: até 1000 contatos
- ManyChat Pro: $15/mês (ilimitado)
- IA usada: ZERO (tudo é template fixo)
- O único custo de IA é no auto-reply do WhatsApp (Groq = grátis)

---

## Métricas para acompanhar
1. **Quantos DMs recebidos** → ManyChat dashboard
2. **Quantos deram WhatsApp** → Conversion rate do flow
3. **Quantos viraram lead no CRM** → /admin/crm dashboard
4. **Quantos converteram** → Pipeline CONVERTED / total
