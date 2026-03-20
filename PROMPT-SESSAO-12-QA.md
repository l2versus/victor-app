# Prompt — Sessao 12: QA Critico — Corrigir 13 bugs antes de producao

## Contexto obrigatorio
Voce e um Senior Software Engineer + QA Lead nivel Vale do Silicio. O **Victor App** passou por uma auditoria QA completa e foram encontrados 13 bugs criticos/altos que DEVEM ser corrigidos ANTES do app ir para producao com alunos reais.

## Estado atual do projeto
- **Framework**: Next.js 16.2.0 + React 19.2 + TypeScript + Prisma 7.5 + PostgreSQL
- **Deploy**: Coolify (VPS 187.77.226.144) + GitHub (l2versus/victor-app)
- **Branch**: main (commit `df1aeb7`)
- **Build**: Limpo, 0 erros, 52 paginas
- **App rodando**: http://dogkkc0ogsc0sw048w0g0sso.187.77.226.144.sslip.io

## REGRAS:
- LEIA todo arquivo antes de editar — nunca adivinhe
- Rode `npx next build` apos cada correcao
- Se o build quebrar, corrija ANTES de continuar
- NAO mude o que funciona — so corrija os bugs listados
- Commits atomicos com mensagem clara em ingles

## BUGS CRITICOS (corrigir primeiro):

### BUG 1 — Webhook MP: bypass de assinatura se secret vazio
**Arquivo**: `src/app/api/webhooks/mercadopago/route.ts:9-14`
**Problema**: `verifyMpSignature()` retorna `true` se `MERCADOPAGO_WEBHOOK_SECRET` nao esta configurado. Em producao, se a env var faltar, qualquer request e aceito.
**Fix**: Em producao (`NODE_ENV === "production"`), rejeitar se secret nao existir. Manter fallback so em dev.

### BUG 2 — Webhook MP: sem transacao no banco
**Arquivo**: `src/app/api/webhooks/mercadopago/route.ts:149-242`
**Problema**: Cria user, student, cancela subscription, cria nova subscription, cria payment, cria notification — tudo sem `prisma.$transaction()`. Se qualquer passo falhar, dados ficam inconsistentes.
**Fix**: Wrap tudo em `prisma.$transaction()`.

### BUG 3 — Prisma schema: 5 relacoes sem CASCADE delete
**Arquivo**: `prisma/schema.prisma`
**Problema**: Se um Student for deletado, ficam orphan records em: WorkoutSession, WorkoutFeedback, Assessment, Payment, Subscription. So StudentWorkoutPlan tem cascade.
**Fix**: Adicionar `onDelete: Cascade` nas 5 relacoes. Rodar `npx prisma db push` apos.

### BUG 4 — proxy.ts: nao verifica sessionVersion
**Arquivo**: `src/app/proxy.ts`
**Problema**: Proxy verifica token mas NAO chama `validateSession()`. Um usuario com token antigo (pre-kick de outro dispositivo) continua acessando.
**Fix**: Chamar `validateSession(payload)` no proxy. Se invalido, redirect para `/login?expired=1`.

### BUG 5 — Email template: XSS
**Arquivo**: `src/lib/email.ts:49,53,64,68`
**Problema**: `${firstName}`, `${planName}`, `${tempPassword}` interpolados direto no HTML sem escape. Nome malicioso `<script>alert(1)</script>` executaria.
**Fix**: Criar funcao `escapeHtml()` e aplicar em todos os valores interpolados.

### BUG 6 — Workout player: race condition no set completion
**Arquivo**: `src/app/(student)/today/workout-player.tsx:160-172`
**Problema**: `completedSets.get(exerciseId).length + 1` le o state ANTES do `setCompletedSets` atualizar (async). Pode transicionar pra rest/summary prematuramente.
**Fix**: Computar a contagem a partir do novo state, nao do antigo.

### BUG 7 — Workout player: falhas silenciosas
**Arquivo**: `src/app/(student)/today/workout-player.tsx:133, 181, 193`
**Problema**: `catch { /* ignore */ }` em 3 lugares. Se a API falha, usuario nao sabe. Sessao pode nao ser criada, set nao salvo, treino nao finalizado.
**Fix**: Adicionar state de erro e mostrar mensagem ao usuario.

## BUGS ALTOS (corrigir depois dos criticos):

### BUG 8 — History: avgDuration NaN
**Arquivo**: `src/app/(student)/history/history-client.tsx:42-44`
**Problema**: Se todos os sessions tem `durationMin: null`, o divisor e 0, resultado e NaN.
**Fix**: Checar `filtered.length > 0` antes de dividir.

### BUG 9 — Workout player: RPE nao obrigatorio
**Arquivo**: `src/app/(student)/today/workout-player.tsx` (summary phase)
**Problema**: Botao "Concluir Treino" habilitado sem selecionar RPE. Perde dado de intensidade.
**Fix**: Desabilitar botao se `rpe === null`.

### BUG 10 — Profile: sem error handling no save
**Arquivo**: `src/app/(student)/profile/profile-client.tsx:58-71`
**Problema**: `handleSave` sem try-catch. Se API falha, usuario fica com UI travada.
**Fix**: Adicionar try-catch, mostrar erro, permitir retry.

### BUG 11 — Admin dashboard: sem check de role
**Arquivo**: `src/app/(admin)/admin/dashboard/page.tsx:19-20`
**Problema**: Checa `if (!session)` mas nao `session.role !== "ADMIN"`. Student com token poderia ver dashboard.
**Fix**: Adicionar `if (!session || session.role !== "ADMIN") redirect("/login")`.

### BUG 12 — Webhook MP: cancela subscription antes de criar payment
**Arquivo**: `src/app/api/webhooks/mercadopago/route.ts:208-230`
**Problema**: Cancela subscriptions ativas ANTES de criar o payment. Se a criacao do payment falhar, aluno fica sem subscription e sem registro de pagamento.
**Fix**: Mover cancelamento para DEPOIS da criacao do payment (ou dentro da transacao do bug 2).

### BUG 13 — Workout player: touch target pequeno
**Arquivo**: `src/app/(student)/today/workout-player.tsx` (SetRow)
**Problema**: Botao de completar serie e `w-8 h-8` (32x32px). Apple HIG exige minimo 44x44px. Durante treino, usuario cansado pode errar o toque.
**Fix**: Aumentar para `w-11 h-11` (44x44px).

## ORDEM DE EXECUCAO:
1. Bugs 1-5 (seguranca + dados) → build → commit
2. Bugs 6-7 (workout player criticos) → build → commit
3. Bugs 8-13 (UX + validacao) → build → commit
4. `npx prisma db push` para aplicar schema changes
5. Push final → redeploy Coolify

## RESULTADO ESPERADO:
- 13 bugs corrigidos
- Build limpo
- App seguro para producao
- Zero falhas silenciosas
- Dados consistentes (transacoes + cascade)

## CUIDADOS:
- `posture-rules.ts` tem 1600+ linhas — NAO mexer
- `posture-analyzer.tsx` tem 570+ linhas — NAO mexer
- MediaPipe v0.10.18 pinado — NAO alterar
- NAO mude UI/UX alem dos bugs listados
