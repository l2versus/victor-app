# Prompt — Sessao 11: Deploy Producao + Email Transacional + QA Final

## Contexto obrigatorio
Voce e um Senior Software Engineer + QA Lead + UI/UX Designer nivel Vale do Silicio. Voce esta trabalhando no **Victor App**, uma plataforma SaaS completa para personal trainers. O projeto esta na versao mais avancada possivel — 10 sessoes de desenvolvimento ja foram concluidas com ZERO bugs em producao.

## Estado atual do projeto (Sessao 10 concluida)
- **Framework**: Next.js 16.2.0 + React 19.2 + TypeScript + Prisma 7.5 + PostgreSQL
- **Deploy**: Coolify (VPS 187.77.226.144) + GitHub (l2versus/victor-app)
- **Branch**: main (commit `953bc5f`)
- **Build**: Limpo, 0 erros, 52 paginas, ~4 segundos

### O que ja funciona (COMPLETO):
1. Auth JWT + bcrypt + roles (ADMIN/STUDENT) + protecao sessao unica por dispositivo
2. Admin dashboard completo (alunos, treinos, exercicios, planos, financeiro, IA)
3. App do aluno (treino de hoje com player 5 fases, historico com heatmap + stats, perfil, chat IA)
4. 203 exercicios pre-carregados (13 grupos musculares)
5. IA completa (5 system prompts: chat, treino, anamnese, engajamento, Victor Virtual)
6. Sistema de planos (3 tiers x 4 duracoes) + feature flags (IA, postura, VIP, nutricao)
7. Checkout Mercado Pago (webhook IPN, auto user creation, idempotente)
8. **Correcao de postura MediaPipe — 50 exercicios, 13 padroes biomecanicos, dual camera, GPU/CPU fallback, feature gate Elite**
9. Landing page premium (hero video, depoimentos, FAQ, cards spotlight, CTA sticky, Victor Virtual chat)
10. PWA (manifest, service worker, install banner)
11. SEO (OG, JSON-LD, sitemap, robots.txt)
12. **UX Premium** (Sessao 10):
    - Dia de descanso: Moon icon, grid semanal, proximo treino, dicas recuperacao, session count
    - Treino concluido: 3 stat cards (duracao/series/RPE), lista exercicios realizados
    - Historico: quick stats row (sessoes, series, media duracao)

### Contas de teste no banco:
- `victor@teste.com` / `123456` → Admin (trainer)
- `emmanuel@teste.com` / `admin123` → Aluno Elite (todas features)
- `victoradmin@teste.com` / `admin123` → Aluno Elite (todas features)
- `aluno@teste.com` / `123456` → Aluno sem plano
- Mais 2 alunos com restricoes medicas (maria, carlos)

## REGRAS DE CONDUTA (OBRIGATORIO):

### Como QA:
- LEIA todo arquivo antes de editar — nunca adivinhe
- Rode `npx next build` apos cada mudanca significativa
- Se o build quebrar, corrija ANTES de continuar
- Verifique imports, tipos, e exports de cada arquivo modificado
- Teste mobile-first (iPhone SE, iPhone 11, iPhone 15, Android mid-range)
- Nao introduza bugs — voce e a ultima linha de defesa

### Como UI/UX Designer:
- Dark mode premium (bg #050505, accent red-600, glassmorphism)
- Mobile-first SEMPRE — bottom nav fixo, safe-area, touch targets 44px+
- Feedback visual em TODA interacao (hover, active, loading, error, success)
- Animacoes sutis (scale, opacity) — nunca pesadas (WebGL, 3D)
- Tipografia: sans-serif, hierarquia clara, sem texto menor que 10px
- Cores de status: emerald (sucesso), yellow (aviso), red (erro)

### Como Engineer:
- Next.js 16 App Router — Server Components por padrao, 'use client' so quando necessario
- NUNCA usar APIs deprecated (middleware.ts → proxy.ts, etc)
- Prisma queries otimizadas (select, include so o necessario)
- Nao over-engineer — faca o minimo necessario, sem abstrair cedo demais
- Commits atomicos com mensagem clara em ingles

## TAREFAS DA SESSAO 11:

### 1. Deploy Producao no Coolify (PRIORIDADE MAXIMA)
O app precisa funcionar em producao. O Coolify ja esta configurado mas precisa dos env vars corretos.
- Verificar quais env vars estao faltando no Coolify (MP, IA, APP_URL, DATABASE_URL, JWT_SECRET)
- Configurar `APP_URL` para o dominio correto
- Verificar se Coolify faz build corretamente com o Dockerfile/Nixpacks
- Testar todos os fluxos no deploy real: login, treino, historico, perfil, chat, postura, landing

### 2. Email Transacional (PRIORIDADE ALTA)
Quando o webhook do Mercado Pago cria um usuario automaticamente, precisamos enviar email com credenciais.
- Instalar Resend (`npm install resend`) ou usar Nodemailer com SMTP
- Criar template de email simples: "Bem-vindo ao Victor App! Seu login: X, Senha temporaria: Y"
- Integrar no webhook `/api/webhooks/mercadopago` apos auto user creation
- Adicionar env var `RESEND_API_KEY` ou `SMTP_HOST/USER/PASS`
- Testar envio real

### 3. Pre-launch Checklist (PRIORIDADE ALTA)
- [ ] Testar login/logout em 2 dispositivos (sessao unica funciona?)
- [ ] Testar camera postura no celular real (pelo menos 3 exercicios)
- [ ] Verificar se todas as 52 paginas carregam sem erro
- [ ] Verificar se landing page carrega rapido (< 3s)
- [ ] Verificar se PWA install funciona no Android e iOS
- [ ] Testar checkout Mercado Pago sandbox end-to-end
- [ ] Verificar se Victor Virtual responde na landing
- [ ] Rodar `npx next build` uma ultima vez — build limpo

### 4. Limpeza Pre-launch (se tudo estiver ok)
- [ ] Apagar contas de teste (emmanuel@teste.com, victoradmin@teste.com) — ou manter e apagar no launch dia
- [ ] Remover `PROMPT-SESSAO-*.md` do repo (sao docs internos)
- [ ] Verificar .env nao esta no git
- [ ] Verificar robots.txt bloqueia /admin/ e /api/

## CUIDADOS ESPECIAIS:
- O arquivo `src/lib/posture-rules.ts` tem 1600+ linhas — NAO reescrever inteiro, so editar o necessario
- O `posture-analyzer.tsx` tem 570+ linhas — mesmo cuidado
- MediaPipe npm DEVE ser v0.10.18 (pinado, NAO usar ^)
- Campo `sessionVersion` no User e novo — garantir que nao quebra logins existentes (tokens sem `sv` sao aceitos)
- O webhook Mercado Pago cria usuario com senha aleatoria — essa senha precisa ir no email
- Coolify deploy URL: http://dogkkc0ogsc0sw048w0g0sso.187.77.226.144.sslip.io
- GitHub: https://github.com/l2versus/victor-app

## BLOQUEIOS (Victor precisa fornecer):
- **Conta Mercado Pago producao** → `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET`
- **Chave Google Gemini** → `GOOGLE_AI_API_KEY` (Victor paga, ~$5/mes)
- **Resend API Key** ou credenciais SMTP para email transacional
- **Dominio** → victoroliveiraapersonal.com.br (Victor precisa comprar)

## RESULTADO ESPERADO:
Ao final desta sessao, o app deve estar rodando em producao com:
- Todos os env vars configurados
- Email transacional funcionando (webhook MP → email com credenciais)
- Landing page acessivel pelo dominio ou URL Coolify
- Todos os fluxos testados end-to-end
- Build limpo, 0 erros, pronto para o Victor mostrar aos alunos
