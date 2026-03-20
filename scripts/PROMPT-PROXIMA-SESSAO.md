# Prompt — Próxima Sessão (18): Deploy Produção + Testes E2E

## O que já foi feito (Sessões 11-17) — NÃO REFAZER:
- [x] QA completa (86+ bugs corrigidos em 6 auditorias)
- [x] OG image, security headers, robots.txt, sitemap
- [x] Planos admin grid ordenados por duração → tier
- [x] Body Map SVG (frente + costas, clicável, intensidade)
- [x] Enciclopédia muscular (13 grupos, alvos, sinergistas, antagonistas, pico contração)
- [x] Anatomia 3D Sketchfab (Écorché rotável na /evolution)
- [x] Header social Instagram-style (avatar, greeting, streak, progresso semanal)
- [x] MediaPipe expandido: 50 → 194 exercícios, 29 padrões biomecânicos
- [x] 32 máquinas Ironberg no banco (Hammer, Hoist, Nautilus, Life Fitness, Cybex)
- [x] 30 modelos 3D Sketchfab mapeados nos exercícios
- [x] Campo "Máquina sugerida" no schema (suggestedMachine)
- [x] Postura: texto GRANDE (28-44px), replay pós-exercício
- [x] Comunidade, ranking, desafios, chat privado
- [x] Nutrição, body scan IA, conquistas automáticas
- [x] Push notifications (VAPID), importador MFIT
- [x] Documentação atualizada (VICTOR-APP-OVERVIEW.md)

---

## PRIORIDADE 1 — BLOQUEANTE (Victor traz as keys)

### 1.1 Configurar as 3 API keys
Victor vai trazer:
- **GOOGLE_AI_API_KEY** → ai.google.dev → Create API key
- **RESEND_API_KEY** → resend.com → API Keys → Create
- **MERCADOPAGO_WEBHOOK_SECRET** → MP Developers → Webhooks → Assinatura secreta

Fluxo:
```
1. Victor cria as keys no notebook dele
2. Eu configuro no .env local
3. bash scripts/validate-keys.sh (confirmar 5/5 OK)
4. Testar local: Chat IA + Victor Virtual + Email
5. Adicionar no Coolify (+ AI_PROVIDER=google)
6. Redeploy Coolify
```

### 1.2 Testar checkout sandbox E2E
```
1. Landing → clique em plano Pro Semestral
2. Preencha: nome, email, telefone
3. Clique Pagar → vai pro MP sandbox
4. Use: TESTUSER7056113908042921725 / JsNwK0x8vI
5. Simule pagamento aprovado
6. Verificar: usuário criado? Subscription ativa? Email enviado?
```

### 1.3 Testar TUDO em produção (Coolify)
- [ ] Landing page + Victor Virtual
- [ ] Login admin (victor@teste.com) → dashboard
- [ ] Login aluno (emmanuel@teste.com) → /today, /evolution, /chat, /posture, /nutrition
- [ ] 3D anatomy + body map + enciclopédia muscular
- [ ] Checkout sandbox → webhook → auto user creation → email
- [ ] Push notification (se VAPID configurado)

---

## PRIORIDADE 2 — POLISH UX (se sobrar tempo)

### 2.1 Admin: campo "Máquina sugerida" no workout builder
- O schema `suggestedMachine` já existe no banco
- Falta: input no formulário de criar/editar treino no admin
- Quando Victor monta o treino, pode escrever "Hammer Strength vermelho, 2ª fileira"
- O aluno vê como 📍 badge no preview do exercício

### 2.2 Animações de conquista
- Confetti/glow quando bate um PR
- Level up animation no ranking
- Celebration modal com share button

### 2.3 Tradução pendente
- Verificar se algum exercício novo (Ironberg) aparece em inglês no app
- "Elevação Pélvica" como alias pro "Hip Thrust com Barra" (busca)

---

## PRIORIDADE 3 — FUTURO (outra sessão)

### 3.1 Migrar MP para produção
- MP Developers → Credenciais produção → Access Token
- Trocar MERCADOPAGO_ACCESS_TOKEN no Coolify
- Configurar webhook produção com URL real
- Novo webhook secret → atualizar no Coolify

### 3.2 Domínio
- Comprar victoroliveiraapersonal.com.br
- Configurar DNS no Coolify/Vercel

### 3.3 Feedback postura com vídeo
- Gravar vídeo durante análise (MediaRecorder API)
- Ao parar, permitir replay do vídeo com overlay dos erros
- Botão "Salvar" pra enviar pro Victor

### 3.4 Mais modelos 3D
- Buscar novos modelos no Sketchfab pra exercícios sem 3D
- Integrar coleção Alexdubob Fitness completa

### 3.5 GIFs animados
- ExerciseDB RapidAPI pra GIFs de execução
- Fallback se não tiver 3D nem GIF

---

## Contas de teste
| Email | Senha | Role |
|-------|-------|------|
| victor@teste.com | 123456 | Admin |
| emmanuel@teste.com | admin123 | Aluno Elite |
| aluno@teste.com | 123456 | Aluno sem plano |

## Comprador teste MP sandbox
- User: TESTUSER7056113908042921725
- Senha: JsNwK0x8vI

## Env vars faltando no Coolify
```
GOOGLE_AI_API_KEY=AIza...
RESEND_API_KEY=re_...
MERCADOPAGO_WEBHOOK_SECRET=...
AI_PROVIDER=google
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contato@victoroliveiraapersonal.com
```
