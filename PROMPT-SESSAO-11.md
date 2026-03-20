# Prompt — Sessao 11: Finalizar Deploy + Keys do Victor + Testes E2E

## Contexto obrigatorio
Voce e um Senior Software Engineer + QA Lead + UI/UX Designer nivel Vale do Silicio. Voce esta trabalhando no **Victor App**, uma plataforma SaaS completa para personal trainers. O projeto tem 10 sessoes completas com ZERO bugs em producao.

## Estado atual do projeto (Sessao 10 concluida — 2026-03-20)
- **Framework**: Next.js 16.2.0 + React 19.2 + TypeScript + Prisma 7.5 + PostgreSQL
- **Deploy**: Coolify (VPS 187.77.226.144) + GitHub (l2versus/victor-app) + Vercel
- **Branch**: main (commit `f46ba03`)
- **Build**: Limpo, 0 erros, 52 paginas, ~4-5 segundos
- **Coolify**: Deploy concluido, app rodando em http://dogkkc0ogsc0sw048w0g0sso.187.77.226.144.sslip.io

### O que ja funciona (COMPLETO — 12 modulos):
1. Auth JWT + bcrypt + roles (ADMIN/STUDENT) + protecao sessao unica
2. Admin dashboard completo (alunos, treinos, exercicios, planos, financeiro, IA)
3. App do aluno (treino player 5 fases, historico heatmap + stats, perfil, chat IA)
4. 203 exercicios pre-carregados (13 grupos musculares)
5. IA completa (5 system prompts: chat, treino, anamnese, engajamento, Victor Virtual)
6. Sistema de planos (3 tiers x 4 duracoes) + feature flags
7. Checkout Mercado Pago (webhook IPN, auto user creation, idempotente)
8. Correcao de postura MediaPipe (50 exercicios, 13 padroes, dual camera, Elite only)
9. Landing page premium + Victor Virtual chatbot
10. PWA + SEO
11. UX Premium (rest day redesign, workout done stats, history stats)
12. **Email transacional (Resend)** — envia login + senha ao aluno criado via checkout MP

### O que ja esta configurado no Coolify:
- DATABASE_URL ✓ | JWT_SECRET ✓ | NIXPACKS_NODE_VERSION=22 ✓
- MERCADOPAGO_ACCESS_TOKEN ✓ (TESTE) | NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ✓ (TESTE)
- AI_PROVIDER=google ✓ | APP_URL ✓ | NEXT_PUBLIC_APP_URL ✓

### Contas de teste:
- `victor@teste.com` / `123456` → Admin (trainer)
- `emmanuel@teste.com` / `admin123` → Aluno Elite
- `victoradmin@teste.com` / `admin123` → Aluno Elite
- `aluno@teste.com` / `123456` → Aluno sem plano
- maria, carlos → alunos com restricoes medicas

### Credenciais MP TESTE (sandbox):
- Access Token: `APP_USR-5652218543804582-031922-d45d293d7b00a24a2b17b84f9192cabf-3279102003`
- Comprador teste: `TESTUSER7056113908042921725` / `JsNwK0x8vI`

## REGRAS DE CONDUTA (OBRIGATORIO):

### Como QA:
- LEIA todo arquivo antes de editar — nunca adivinhe
- Rode `npx next build` apos cada mudanca significativa
- Se o build quebrar, corrija ANTES de continuar

### Como Engineer:
- Next.js 16 App Router — Server Components por padrao
- NUNCA usar APIs deprecated
- Commits atomicos com mensagem clara em ingles

## TAREFAS DA SESSAO 11:

### 1. Configurar as 3 keys que faltam (PRIORIDADE MAXIMA)
O Victor vai mandar 3 chaves. Assim que receber:
- **MERCADOPAGO_WEBHOOK_SECRET** → adicionar no .env local + pedir pro Emmanuel colocar no Coolify
- **GOOGLE_AI_API_KEY** (ou ANTHROPIC_API_KEY) → idem
- **RESEND_API_KEY** → idem
- Fazer redeploy no Coolify apos adicionar

### 2. Testar o app em producao (PRIORIDADE ALTA)
Acessar http://dogkkc0ogsc0sw048w0g0sso.187.77.226.144.sslip.io e testar:
- [ ] Landing page carrega corretamente (hero, depoimentos, FAQ, planos)
- [ ] Login com `victor@teste.com` → admin dashboard carrega
- [ ] Login com `emmanuel@teste.com` → app do aluno carrega
- [ ] Pagina /today (treino ou dia de descanso)
- [ ] Pagina /history (heatmap + stats)
- [ ] Pagina /profile (dados + medidas)
- [ ] Pagina /chat (so funciona com key de IA)
- [ ] Pagina /posture (so Elite — verificar se carrega)
- [ ] Victor Virtual na landing (so funciona com key de IA)
- [ ] Checkout: clicar em um plano → checkout MP sandbox funciona?

### 3. Testar checkout sandbox end-to-end
- Clicar "Assinar" em um plano na landing page
- Preencher dados e ir pro checkout do MP
- Logar com usuario teste: TESTUSER7056113908042921725 / JsNwK0x8vI
- Simular pagamento aprovado
- Verificar: usuario criado no banco? Subscription ativa? Email enviado?

### 4. Migrar para credenciais de PRODUCAO (quando Victor quiser)
- No MP Developers → Credenciais de producao → copiar Access Token
- Trocar MERCADOPAGO_ACCESS_TOKEN no Coolify (remover o de teste)
- Webhook no MP: configurar URL de producao + copiar novo secret
- Redeploy

### 5. Pre-launch final
- [ ] Verificar se PWA install funciona (Android + iOS)
- [ ] Verificar robots.txt bloqueia /admin/ e /api/
- [ ] Verificar .env NAO esta no git (esta no .gitignore)
- [ ] Apagar contas de teste (emmanuel, victoradmin) antes do launch real
- [ ] Rodar build limpo uma ultima vez

## CUIDADOS ESPECIAIS:
- `src/lib/posture-rules.ts` tem 1600+ linhas — NAO reescrever
- `posture-analyzer.tsx` tem 570+ linhas — mesmo cuidado
- MediaPipe npm DEVE ser v0.10.18 (pinado)
- Campo `sessionVersion` — tokens antigos sem `sv` sao aceitos
- Email transacional ja esta implementado (`src/lib/email.ts`) — so precisa da RESEND_API_KEY

## PARA O VICTOR FAZER (mandar pro Emmanuel):
Mande estas 3 coisas pro Emmanuel:

1. **Webhook Secret do Mercado Pago**:
   - Va em mercadopago.com.br/developers → Suas integracoes → Victor-app → Webhooks
   - Clique no icone de recarregar (setinha) ao lado da "Assinatura secreta"
   - Copie e mande

2. **Chave de IA** (escolha UMA):
   - Google Gemini (GRATIS): Va em ai.google.dev → "Get API key" → copie
   - OU Anthropic Claude (pago): Va em console.anthropic.com → API Keys → crie uma

3. **Chave do Resend** (email):
   - Va em resend.com → crie conta (login com Google) → copie a API Key

## RESULTADO ESPERADO:
App 100% funcional em producao. Victor pode mostrar para alunos reais.
