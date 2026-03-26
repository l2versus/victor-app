# Guia Completo: Automacao ManyChat + ONEFIT

## O que voce vai conseguir:
- Bot no Instagram que responde DMs automaticamente com IA
- Captura de leads automatica no CRM da ONEFIT
- Respostas personalizadas sobre a plataforma 24h por dia

---

## Pre-requisitos

- Conta no Instagram Business (nao funciona com conta pessoal)
- Pagina do Facebook vinculada ao Instagram
- Acesso ao painel Master Admin da ONEFIT (para ver os leads)
- Token do webhook configurado no Vercel (variavel `MASTER_CRM_WEBHOOK_TOKEN`)

---

## Passo 1: Criar conta no ManyChat

1. Acesse [manychat.com](https://manychat.com)
2. Clique em **"Get Started Free"**
3. Escolha **"Instagram"** como canal principal
4. Faca login com sua conta do Facebook
5. Selecione a **Pagina do Facebook** vinculada ao seu Instagram Business
6. Autorize todas as permissoes solicitadas (mensagens, comentarios, etc.)
7. Pronto! Voce vai cair no painel do ManyChat

> **Dica:** O plano gratuito do ManyChat permite ate 1.000 contatos. Para mais, precisa do plano Pro ($15/mes).

---

## Passo 2: Criar Custom Fields (Campos Personalizados)

Antes de criar os flows, configure os campos que vao armazenar os dados dos leads:

1. No menu lateral, va em **"Settings"** (engrenagem)
2. Clique em **"Custom Fields"**
3. Crie os seguintes campos:
   - `lead_type` (Text) — Tipo do lead (Personal Trainer, Nutricionista, Academia)
   - `estimated_students` (Number) — Quantidade de alunos/pacientes
   - `lead_email` (Text) — Email profissional do lead

---

## Passo 3: Criar o Flow de Captura de Leads

1. No menu lateral, va em **"Automation"** → **"Flows"**
2. Clique em **"+ New Flow"**
3. Nomeie: **"ONEFIT - Captura de Leads"**
4. Clique em **"Add Trigger"**
5. Escolha **"Keyword"** (Palavra-chave)
6. Adicione as palavras-chave (uma por linha):
   - `app`
   - `plataforma`
   - `sistema`
   - `personal`
   - `academia`
   - `nutricionista`
   - `fitness`
   - `onefit`
7. Em "Keyword matching rule", selecione **"Message contains keyword"**
8. Clique em **"Save"**

### Primeira mensagem do bot:

1. No editor visual, clique no bloco de mensagem
2. Digite:

```
Oi {{first_name}}! Vi que voce tem interesse em ter seu proprio app fitness. Posso te ajudar!
```

3. Adicione 2 **botoes** (Quick Reply):
   - Botao 1: **"Quero saber mais"**
   - Botao 2: **"Quanto custa?"**

---

## Passo 4: Coletar Dados do Lead

Depois que o lead clicar em **"Quero saber mais"**, adicione os seguintes blocos em sequencia:

### Bloco 1 — Tipo de Profissional

1. Arraste uma nova **mensagem** conectada ao botao "Quero saber mais"
2. Digite:

```
Legal! Pra eu te recomendar o melhor plano, me conta: voce e personal trainer, nutricionista ou dono de academia?
```

3. Adicione 3 botoes:
   - **"Personal Trainer"**
   - **"Nutricionista"**
   - **"Dono de Academia"**
4. Em **cada botao**, adicione uma **Action** → **"Set Custom Field"**:
   - Campo: `lead_type`
   - Valor: `PERSONAL_TRAINER`, `NUTRICIONISTA` ou `ACADEMIA` (respectivamente)

### Bloco 2 — Quantidade de Alunos

1. Adicione nova mensagem conectada aos 3 botoes acima:

```
E quantos alunos/pacientes voce atende hoje? Pode digitar o numero.
```

2. Adicione **"User Input"** → tipo **Number**
3. Salve em Custom Field: `estimated_students`
4. Mensagem de erro: `"Digita so o numero, por favor!"`

### Bloco 3 — Email

1. Adicione nova mensagem:

```
Quase la! Qual seu email profissional? Vou te enviar um material exclusivo.
```

2. Adicione **"User Input"** → tipo **Email**
3. Salve em Custom Field: `lead_email`
4. Mensagem de erro: `"Hmm, parece que esse email nao ta certo. Tenta de novo?"`

---

## Passo 5: Enviar Lead para o CRM da ONEFIT (Webhook)

Apos coletar o email, envie os dados para o CRM:

1. Adicione um bloco **"Action"**
2. Escolha **"External Request"** (pode aparecer como "Make request to external service")
3. Configure:

| Campo | Valor |
|-------|-------|
| **Request Type** | POST |
| **URL** | `https://SEU-DOMINIO.vercel.app/api/master/crm/webhook?token=SEU_TOKEN` |
| **Headers** | `Content-Type: application/json` |

4. No **Body**, selecione **"JSON"** e cole:

```json
{
  "name": "{{first_name}} {{last_name}}",
  "email": "{{lead_email}}",
  "phone": "{{phone}}",
  "type": "{{lead_type}}",
  "source": "MANYCHAT",
  "estimatedStudents": "{{estimated_students}}",
  "city": "{{city}}"
}
```

5. Clique em **"Test Request"** para verificar se funciona
6. Se retornar status 200, esta tudo certo!

> **IMPORTANTE:** Substitua `SEU-DOMINIO` pela URL real do seu deploy (ex: `onefit.vercel.app`) e `SEU_TOKEN` pelo valor da variavel `MASTER_CRM_WEBHOOK_TOKEN` do Vercel.

### Mensagem de confirmacao:

Apos o webhook, adicione uma mensagem:

```
Perfeito, {{first_name}}! Ja registrei seus dados. Nosso time vai entrar em contato em breve. Enquanto isso, quer tirar alguma duvida sobre a plataforma?
```

Botoes:
- **"Tenho uma duvida"** → vai pro fluxo de IA (Passo 7)
- **"Por agora e so isso"** → mensagem final de despedida

---

## Passo 6: Flow de Precos

Para quem clicou em **"Quanto custa?"** no Passo 3:

1. Conecte o botao "Quanto custa?" a uma nova mensagem:

```
Temos 3 planos perfeitos pra voce:

Starter — R$97/mes
1 profissional, 30 alunos

Pro — R$197/mes (mais escolhido!)
3 profissionais, 100 alunos, IA, CRM

Business — R$497/mes
Ilimitado, white-label, dominio proprio

Qual te interessa mais?
```

2. Adicione 3 botoes:
   - **"Starter"**
   - **"Pro"**
   - **"Business"**

3. Para cada botao, adicione Action → Set Custom Field:
   - Campo: `lead_type` (reutilize ou crie `preferred_plan`)
   - Valor: `STARTER`, `PRO` ou `BUSINESS`

4. Apos a escolha, envie:

```
Otima escolha! Vou te passar pro nosso time comercial finalizar. Qual seu WhatsApp? (DDD + numero)
```

5. User Input → tipo Phone → salve no campo `phone` do ManyChat

6. Depois, dispare o **mesmo webhook do Passo 5** para registrar no CRM

7. Mensagem final:

```
Pronto! Nosso time vai te chamar no WhatsApp em ate 24h. Se quiser agilizar, chama a gente: wa.me/5585996985823
```

---

## Passo 7: Respostas com IA (Avancado)

Este passo permite que o bot responda perguntas livres usando IA:

1. No flow, quando o lead clicar **"Tenho uma duvida"**, adicione:

```
Manda sua duvida ai que respondo na hora!
```

2. Adicione **"User Input"** → tipo **Text** → salve em variavel `last_input_text`

3. Adicione **"Action"** → **"External Request"**:

| Campo | Valor |
|-------|-------|
| **Request Type** | POST |
| **URL** | `https://SEU-DOMINIO.vercel.app/api/master/crm/ai-reply?token=SEU_TOKEN` |
| **Headers** | `Content-Type: application/json` |

4. Body (JSON):

```json
{
  "message": "{{last_input_text}}",
  "name": "{{first_name}}",
  "context": "Lead veio do Instagram, tipo: {{lead_type}}"
}
```

5. Em **"Response Mapping"**, mapeie:
   - JSONPath: `$.reply`
   - Salve em Custom Field: crie um campo `ai_response` (Text)

6. Adicione uma mensagem usando a variavel:

```
{{ai_response}}
```

7. Adicione botoes:
   - **"Outra duvida"** → volta pro User Input (cria um loop)
   - **"Quero assinar"** → vai pro fluxo de precos
   - **"Valeu, era isso"** → mensagem de despedida

> **Dica:** O loop de perguntas funciona como um chat! O lead pode perguntar varias coisas e a IA responde cada uma.

---

## Passo 8: Trigger por Comentario no Instagram

Capture leads que comentam nos seus posts:

1. Va em **"Automation"** → **"+ New Flow"**
2. Nomeie: **"ONEFIT - Comentario no Post"**
3. Trigger: **"Instagram Comment"**
4. Configure:
   - **Post**: selecione o post especifico (ou "Any Post")
   - **Keywords** no comentario: `quero`, `link`, `app`, `como`, `preco`, `quanto`
5. Marque: **"Reply to the comment"** e escreva:

```
Te mandei uma mensagem no Direct!
```

6. Adicione mensagem no DM:

```
Oi {{first_name}}! Vi seu comentario e quero te mostrar como ter seu proprio app fitness. Posso te contar mais?
```

7. Botoes:
   - **"Quero saber mais"** → conecte ao mesmo fluxo do Passo 3
   - **"Agora nao"** → mensagem: "Sem problemas! Quando quiser, e so mandar 'app' aqui."

---

## Passo 9: Configurar Variaveis de Ambiente

No **Vercel** (onde a ONEFIT esta hospedada):

1. Acesse [vercel.com](https://vercel.com) → seu projeto
2. Va em **"Settings"** → **"Environment Variables"**
3. Adicione (se ainda nao existir):

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `MASTER_CRM_WEBHOOK_TOKEN` | Gere um token seguro (ex: `mck_onefit_2026_xyz123`) | Production, Preview |

4. Clique **"Save"**
5. Faca um **redeploy** para aplicar a variavel

> **Como gerar um token seguro:** Abra o terminal e rode `openssl rand -hex 32` ou use um gerador online de tokens.

---

## Passo 10: Testando Tudo

### Teste 1 — Palavra-chave
1. Mande uma DM pro seu Instagram com a palavra **"app"**
2. O bot deve responder automaticamente com a mensagem do Passo 3
3. Siga o fluxo completo ate o final

### Teste 2 — Webhook (CRM)
1. Complete o fluxo ate o ponto do webhook
2. Acesse o **Master Admin** da ONEFIT
3. Va em **Pipeline de Vendas**
4. O lead deve aparecer na primeira coluna com os dados preenchidos

### Teste 3 — IA
1. No fluxo, clique em "Tenho uma duvida"
2. Pergunte: **"O app funciona offline?"**
3. A IA deve responder em 2-3 frases sobre a plataforma

### Teste 4 — Comentario
1. Comente **"quero"** em um post configurado
2. Voce deve receber uma DM automatica

---

## Solucao de Problemas

| Problema | Solucao |
|----------|---------|
| Bot nao responde | Verifique se o Instagram esta conectado em ManyChat → Settings → Channels |
| Webhook retorna 401 | Confira se o token na URL esta igual ao do Vercel |
| Webhook retorna 500 | Verifique os logs no Vercel (Deployments → Functions → Logs) |
| IA nao responde | Verifique se a variavel `GROQ_API_KEY` esta configurada no Vercel |
| Comentario nao dispara | O post precisa ter sido publicado APOS a criacao do trigger |
| "User Input" nao funciona | Certifique-se que o tipo do input (Text/Number/Email) esta correto |

---

## Arquitetura do Sistema

```
Instagram DM/Comentario
    |
    v
ManyChat (Flow de Automacao)
    |
    ├── Coleta dados (nome, tipo, alunos, email)
    |       |
    |       v
    |   Webhook POST → /api/master/crm/webhook
    |       |
    |       v
    |   Lead criado no CRM (Pipeline de Vendas)
    |
    └── Pergunta livre do lead
            |
            v
        POST → /api/master/crm/ai-reply
            |
            v
        Resposta da IA (Groq/Llama)
            |
            v
        ManyChat exibe no DM
```

---

## Proximos Passos

- [ ] Configurar **notificacao por email** quando um lead entrar (ManyChat → Notify Admin)
- [ ] Criar flow para **Stories** (reply to story mention)
- [ ] Adicionar **retargeting** — se o lead nao respondeu em 24h, mandar follow-up
- [ ] Integrar com **Facebook Ads** — leads de anuncio caem direto no flow

---

## Bonus: WhatsApp Bot ONEFIT (Evolution API)

Alem do ManyChat no Instagram, voce pode ter um bot no WhatsApp que:
- Responde automaticamente sobre planos e precos
- Cria leads no CRM automaticamente
- Usa IA para responder perguntas sobre a plataforma
- Detecta tipo de lead (Personal, Nutricionista, Academia) e adapta o pitch
- Classifica temperatura automaticamente (HOT/WARM/COLD)

### Configuracao:

1. Defina as variaveis de ambiente no Vercel:
   - `ONEFIT_EVOLUTION_URL` = URL do seu servidor Evolution API
   - `ONEFIT_EVOLUTION_KEY` = API Key da instancia
   - `ONEFIT_EVOLUTION_WEBHOOK_SECRET` = Secret para validar webhooks (obrigatorio em producao)
2. Execute o script de setup: `npx tsx scripts/setup-onefit-evolution.ts`
3. Escaneie o QR code com o WhatsApp do numero 85 998500344
4. Pronto! O bot ja esta respondendo e capturando leads

### Arquitetura:

```
WhatsApp (85 998500344)
    |
    v
Evolution API (instancia: onefit-b2b)
    |
    v
Webhook POST → /api/webhooks/onefit-evolution
    |
    ├── Lead novo? → Cria no SaasLead (CRM Master)
    ├── Lead existente? → Atualiza status + historico
    |
    v
IA (Groq/Llama) gera resposta de vendas
    |
    v
Evolution API envia resposta no WhatsApp
```

> **Importante:** Esta instancia e SEPARADA do bot do Victor (trainer). Cada um tem seu proprio numero, instancia e webhook.
