# Sessão 15 — Deploy Produção + Nutrição + PWA Push + Final Polish

## Contexto
Victor App é uma plataforma fitness (Next.js 16 + Prisma + PostgreSQL + AI SDK).
Sessões 1-14 completas. Comunidade, ranking, chat, body scan IA, notificações — tudo pronto.
Verificar memory em `C:\Users\admin\.claude\projects\c--Users-admin-Desktop-victor-app\memory\`

## O que fazer nesta sessão (em ordem de prioridade):

### 1. DEPLOY PRODUÇÃO (quando Victor trouxer as keys)
- **3 API keys necessárias**:
  - MERCADOPAGO_WEBHOOK_SECRET (produção)
  - GOOGLE_AI_API_KEY (ou ANTHROPIC_API_KEY — produção)
  - RESEND_API_KEY (produção)
- Rodar `scripts/validate-keys.sh` para checar
- Trocar credenciais MercadoPago de TESTE → PRODUÇÃO
- Testar checkout E2E sandbox antes de trocar
- Apagar contas de teste (emmanuel@teste.com, victoradmin@teste.com)
- Configurar domínio (victoroliveiraapersonal.com.br se comprou)
- SSL, security headers, CSP — tudo já ok da Sessão 11
- Testar fluxo completo: registro → plano → pagamento → app → treino → evolução

### 2. MÓDULO DE NUTRIÇÃO (hasNutrition feature flag já existe)
- **Schema**: NutritionLog (studentId, date, meals JSON, totalCalories, protein, carbs, fat)
- **Página /nutrition** no app do aluno:
  - Registro de refeições (café, almoço, jantar, snack)
  - Macros do dia (proteína, carb, gordura) com gráfico circular
  - Meta diária baseada no objetivo (cutting, bulking, manutenção)
  - Histórico semanal com gráfico de barras
- **API**: /api/student/nutrition (GET/POST)
- **IA**: Sugestão de ajuste nutricional baseado nos treinos da semana
- **Feature gate**: Pro + Elite (hasNutrition)

### 3. PWA PUSH NOTIFICATIONS
- Service worker já existe (manifest.json ok da Sessão 6)
- Implementar Web Push API:
  - Pedir permissão de notificação ao aluno
  - Armazenar subscription no banco (PushSubscription model)
  - Victor pode enviar push via admin (broadcast ou individual)
  - Notificações automáticas: novo treino, desafio, mensagem
- VAPID keys (gerar com web-push package)

### 4. MÓDULO DE MÁQUINAS DE ACADEMIA (QR CODE)
- Schema: GymMachine (name, description, muscleGroups, qrCode, instructions, photoUrl)
- Admin cria máquinas → gera QR code único
- Aluno escaneia QR → vê instruções + vídeo da máquina
- Link para exercícios relacionados no catálogo
- Impressão de QR em PDF para colar na máquina

### 5. LANDING PAGE V2 (se sobrar tempo)
- Vídeo hero (Victor treinando)
- Antes/depois de alunos (com autorização)
- Integração com Instagram feed
- Seção "Tecnologia" mostrando IA + postura + body scan

## Checklist pré-launch:
- [ ] 3 API keys produção configuradas
- [ ] Checkout E2E testado (PIX + cartão)
- [ ] Contas de teste apagadas
- [ ] Domínio apontado
- [ ] Webhook MP produção configurado
- [ ] Email de welcome testado em produção
- [ ] PWA instalável no mobile
- [ ] Lighthouse score > 90
- [ ] SEO meta tags ok (OG image, title, description)
- [ ] Backup do banco antes do launch

## Regras de ouro:
1. Mobile-first SEMPRE — testar em viewport 375px
2. Dark mode premium (vermelho + preto) — NUNCA branco
3. Glassmorphism nos cards — bg-white/[0.02] + backdrop-blur-xl
4. Touch targets mínimo 44x44px (Apple HIG)
5. Build limpo antes de commit — 0 erros TypeScript
6. QA audit completo no final
7. Atualizar memory no final
8. Design SUPERIOR ao Hevy em todos os aspectos
