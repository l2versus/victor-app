# Prompt — Sessao 18: Ativar APIs + Deploy Producao + Testes E2E

## Contexto obrigatorio
Voce e um Senior Software Engineer + QA Lead + DevOps especialista. Voce esta trabalhando no **Victor App**, uma plataforma SaaS completa para personal trainers. O projeto tem 17 sessoes completas com ZERO bugs em producao.

## Estado atual do projeto (Sessao 17 concluida — 2026-03-20)
- **Framework**: Next.js 16.2.0 + React 19.2 + TypeScript + Prisma 7.5 + PostgreSQL
- **Deploy**: Coolify (VPS 187.77.226.144) + Vercel + GitHub (l2versus/victor-app)
- **Build**: Limpo, 0 erros, 74 paginas
- **Banco**: 235 exercicios, 6 users, 12 planos, 20+ tabelas
- **MediaPipe**: 194 exercicios com analise biomecanica, 29 padroes
- **3D**: 33 modelos Sketchfab mapeados, anatomia 3D rotavel
- **Postura**: texto grande (28-44px), replay video + timeline erros

### O que funciona SEM keys (tudo isso ja roda):
1. Landing page premium (hero video, planos, FAQ, depoimentos, Victor Virtual*)
2. Auth JWT + sessao unica + roles (ADMIN/STUDENT)
3. Admin completo (dashboard, alunos, treinos, exercicios, planos, financeiro, IA*, import MFIT)
4. App aluno (header social, treino player 5 fases, evolucao, postura, perfil, comunidade, nutricao)
5. Checkout Mercado Pago (redireciona pro MP, webhook*)
6. Correcao postura MediaPipe (194 exercicios, replay video, 32 maquinas Ironberg)
7. Body Map SVG + Anatomia 3D + Enciclopedia muscular + Modelos 3D exercicios
8. Celebrations (confetti + modal PR/streak/milestone)
9. PWA + SEO + OG image + security headers

*Items com asterisco precisam das API keys pra funcionar

### Env vars JA configuradas no Coolify:
- DATABASE_URL ✓ | JWT_SECRET ✓ | NIXPACKS_NODE_VERSION=22 ✓
- MERCADOPAGO_ACCESS_TOKEN ✓ (TESTE) | NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ✓ (TESTE)
- AI_PROVIDER=google ✓ | APP_URL ✓ | NEXT_PUBLIC_APP_URL ✓

### Contas de teste:
- `victor@teste.com` / `123456` → Admin (trainer)
- `emmanuel@teste.com` / `admin123` → Aluno Elite
- `aluno@teste.com` / `123456` → Aluno sem plano

### Credenciais MP TESTE (sandbox):
- Comprador teste: `TESTUSER7056113908042921725` / `JsNwK0x8vI`

## REGRAS DE CONDUTA (OBRIGATORIO):
- LEIA todo arquivo antes de editar
- Rode `npx next build` apos cada mudanca
- Se o build quebrar, corrija ANTES de continuar
- NUNCA toque em `posture-rules.ts` (1689 linhas) nem `posture-analyzer.tsx` sem necessidade
- Commits atomicos com mensagem clara em ingles

---

## TAREFAS DA SESSAO 18:

### FASE 1 — Configurar API Keys (Victor traz)

O Victor vai mandar 3 chaves. Assim que receber:

**Chave 1 — GOOGLE_AI_API_KEY:**
```bash
# Validar que funciona
curl "https://generativelanguage.googleapis.com/v1beta/models?key=CHAVE_AQUI"
# Se retornar lista de modelos → OK
```
- Adicionar no `.env` e `.env.local`
- Testar: Chat IA (/chat), Victor Virtual (landing), Geracao treinos, Anamnese

**Chave 2 — RESEND_API_KEY:**
```bash
# Validar
curl -H "Authorization: Bearer CHAVE_AQUI" https://api.resend.com/domains
# Se retornar 200 → OK
```
- Adicionar no `.env`
- Testar: fazer checkout sandbox → verificar se email chega

**Chave 3 — MERCADOPAGO_WEBHOOK_SECRET:**
- Adicionar no `.env`
- Testar: webhook do MP agora valida assinatura HMAC-SHA256

**Script automatico (alternativa):**
```bash
bash scripts/setup-keys-live.sh    # pede cada key interativamente
bash scripts/validate-keys.sh      # valida todas (HTTP requests reais)
```

### FASE 2 — Adicionar no Coolify + Redeploy

Adicionar estas env vars no Coolify (painel web):
```
GOOGLE_AI_API_KEY=AIza...
RESEND_API_KEY=re_...
MERCADOPAGO_WEBHOOK_SECRET=...
AI_PROVIDER=google
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   (copiar do .env.local)
VAPID_PRIVATE_KEY=...              (copiar do .env.local)
VAPID_SUBJECT=mailto:contato@victoroliveiraapersonal.com
```
Depois: clicar "Deploy" no Coolify → esperar "rolling update completed"

### FASE 3 — Testes E2E em Producao

Acessar http://dogkkc0ogsc0sw048w0g0sso.187.77.226.144.sslip.io e testar:

**Landing page:**
- [ ] Hero + video carrega
- [ ] Victor Virtual (balao chat): mandar "Ola" → IA responde?
- [ ] Planos carregam com precos corretos

**Login Admin:**
- [ ] Login `victor@teste.com` / `123456`
- [ ] Dashboard com stats
- [ ] IA Tools: gerar treino, analisar anamnese, engajamento

**Login Aluno:**
- [ ] Login `emmanuel@teste.com` / `admin123`
- [ ] /today: treino ou rest day
- [ ] /chat: mandar mensagem → IA responde?
- [ ] /evolution: graficos + anatomia 3D + body map
- [ ] /posture: camera + analise + replay
- [ ] /nutrition: adicionar alimento + ver macros
- [ ] /community: ranking + feed
- [ ] /profile: dados + upgrade

**Checkout E2E (sandbox):**
- [ ] Landing → clicar plano Pro Semestral → preencher form → Pagar
- [ ] MP sandbox → logar com TESTUSER7056113908042921725 / JsNwK0x8vI
- [ ] Simular pagamento aprovado
- [ ] Verificar: usuario criado? Subscription ativa? Email recebido?

**Push Notification:**
- [ ] /profile → ativar notificacoes → aceitar permissao
- [ ] Admin → enviar broadcast → aluno recebe?

### FASE 4 — Pre-launch (se tudo OK)

- [ ] Verificar PWA install funciona (Android + iOS)
- [ ] Verificar robots.txt bloqueia /admin/ e /api/
- [ ] Verificar .env NAO esta no git
- [ ] Rodar build limpo uma ultima vez
- [ ] Considerar: trocar MP teste → producao (opcional)
- [ ] Considerar: comprar dominio

## RESULTADO ESPERADO:
App 100% funcional em producao. Victor pode mostrar para alunos reais.
