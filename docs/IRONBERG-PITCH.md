# Proposta Comercial — Ironberg App

> Transformar a venda de equipamentos em receita recorrente com software inteligente.

---

## O Problema

Academias compram máquinas Ironberg (venda única) e depois não há relação contínua. Personal trainers usam papel, planilhas ou apps genéricos (MFIT) que não conhecem as máquinas da academia.

## A Solução

**Ironberg App** — plataforma de treinamento inteligente que já integra **19 máquinas Ironberg com modelos 3D**, análise postural por câmera, IA contextual e checkout integrado.

Cada máquina Ironberg ganha um **QR Code** que, ao ser escaneado pelo aluno, abre:
- Modelo 3D interativo da máquina (Three.js, arraste para girar)
- Marca + país de origem (Hammer Strength 🇺🇸, Panatta 🇮🇹, Nautilus 🇺🇸, etc.)
- Exercícios possíveis com instruções detalhadas
- Correção postural em tempo real pela câmera (IA exclusiva)
- Vídeos de execução correta

---

## Diferenciais Exclusivos (nenhum concorrente tem)

### 1. Correção Postural por IA (MediaPipe)
- 256 exercícios analisados em tempo real pela câmera do celular
- Body Scan: análise de proporções corporais (5 biotipos: V, Trapézio, X, Retângulo, Pêra)
- Feedback visual: ângulos, alinhamento, amplitude
- Funciona offline (processamento no device)
- **Valor:** reduz lesões, diferencia a academia

### 2. 19 Máquinas 3D com Marca e Origem
- Modelos Three.js interativos (.glb) com auto-rotação + fullscreen
- 8 marcas mapeadas com bandeira + país + descrição:
  - 🇺🇸 Hammer Strength — Gravitron, Shoulder Press, Prone Leg Curl
  - 🇮🇹 Panatta — Leg Press 45°, Hack Squat, Cable Crossover, Multi-Hip, V-Squat, Rosca Bíceps
  - 🇺🇸 Nautilus — Chest Press, Rotary Torso
  - 🇺🇸 Life Fitness — Leg Press Sentado
  - 🇺🇸 Cybex Prestige — Lat Pulldown
  - 🇹🇼 Matrix — Abdução/Adução, Flexora Sentada, Pec Deck/Fly Reverso
  - 🇧🇷 Stark Strong — Supino Inclinado
  - 🇩🇪 ICG — Spinning Bikes
- Picker 3D no editor de treino — personal seleciona máquina visualmente
- Card de origem automático no app do aluno (bandeira + descrição da marca)
- **Valor:** aluno entende a máquina antes de usar, branding premium

### 3. Prescrição por Voz
- Personal fala: "Supino 4 séries de 10 com 60kg"
- IA transcreve e monta a ficha automaticamente
- Matching com 285 exercícios da biblioteca (PT-BR + inglês bilíngue)
- **Valor:** economiza 80% do tempo de prescrição

### 4. IA Contextual (Groq + Claude)
- Chat inteligente que conhece o aluno (peso, altura, histórico, restrições, nutrição)
- Gera treinos personalizados automaticamente
- Analisa anamnese e sugere exercícios seguros
- Post-workout feedback: extrai RPE, dor, energia, sono, ajustes de carga
- **Valor:** personal atende mais alunos com qualidade

### 5. Broadcast Inteligente com IA
- Mensagens em massa com texto gerado por IA
- Filtros: gênero, idade, status, seleção individual de alunos
- Canais: app + push notification + WhatsApp
- Ocasiões: aniversário, motivacional, promoção, retorno, lembrete de treino
- **Valor:** engajamento e retenção automáticos

### 6. Checkout In-App (Mercado Pago)
- PIX QR code, cartão de crédito, boleto — direto no app
- Webhook automático: pagamento aprovado → assinatura ativada
- Auto-criação de conta para novos alunos
- Alertas automáticos: inadimplente, expirando, compra realizada
- 3 planos × 4 durações (mensal, trimestral, semestral, anual)
- **Valor:** conversão self-service, menos trabalho manual

### 7. CRM com Kanban
- Board de leads com drag & drop (Novo → Contato → Negociação → Fechado → Perdido)
- Captura automática de leads via WhatsApp
- Lead scoring inteligente
- **Valor:** funil de vendas profissional

### 8. Dashboard BI Interativo
- Health Score (0-100) baseado em retenção/engajamento/cobertura
- KPIs clicáveis com drill-down individual (cada aluno)
- Gráficos animados: barra, donut, sparklines
- Alertas automáticos de churn, inadimplência, oportunidades
- Export CSV
- **Valor:** visão completa do negócio em tempo real

### 9. Spotify Integrado
- Aluno treina ouvindo suas playlists
- OAuth nativo, mini player na tela de treino
- **Valor:** experiência premium

### 10. Comunidade & Gamificação
- Ranking de alunos (sessões, cargas, streak)
- Desafios com prazo e meta
- Feed social com conquistas
- **Valor:** competição saudável, retenção orgânica

---

## Comparativo vs MFIT Personal

| Feature | MFIT | Ironberg App | Vantagem |
|---------|------|-------------|----------|
| Correção postural IA | Não tem | 256 exercícios | **EXCLUSIVO** |
| Máquinas 3D com marca | Não tem | 19 modelos + 8 marcas | **EXCLUSIVO** |
| Body Scan IA | Não tem | Shape + ratios + coaching | **EXCLUSIVO** |
| Prescrição por voz | Não tem | Web Speech + IA | **EXCLUSIVO** |
| Spotify no treino | Não tem | OAuth + player | **EXCLUSIVO** |
| CRM Kanban | Não tem | Lead scoring + funil | **EXCLUSIVO** |
| BI Dashboard | Básico | Health Score + drill-down | **EXCLUSIVO** |
| Checkout in-app | Sim | PIX + cartão + boleto MP | **PAR** |
| Broadcast WhatsApp IA | Manual | IA + filtros + push | **SUPERIOR** |
| Chat IA contextual | Básico | Groq + Claude + histórico | **SUPERIOR** |
| Treinos com vídeo/foto | Sim | Sim + 3D + marca | **SUPERIOR** |
| Evolução de cargas | Sim | Sim + gráficos interativos | **SUPERIOR** |
| PDF treino | Sim | Sim | **PAR** |

**Resultado: 7 EXCLUSIVOS, 4 SUPERIORES, 2 PAR. Zero inferioridade.**

---

## Modelo de Negócio B2B (White-Label)

### Para Academias Clientes Ironberg

| Plano | Para quem | Preço/mês | Inclui |
|-------|-----------|-----------|--------|
| **Ironberg Starter** | 1 personal, até 30 alunos | R$ 297 | App + 3D + IA básica |
| **Ironberg Pro** | Até 5 personais, 150 alunos | R$ 797 | + Postura IA + WhatsApp + QR |
| **Ironberg Enterprise** | Rede de academias | Sob consulta | + Multi-unidade + marca própria |

### Receita Projetada

| Cenário | Academias | Ticket médio | MRR |
|---------|-----------|-------------|-----|
| Conservador | 20 academias | R$ 500 | R$ 10.000/mês |
| Moderado | 50 academias | R$ 600 | R$ 30.000/mês |
| Agressivo | 100 academias | R$ 700 | R$ 70.000/mês |

### ROI para a Ironberg

1. **Venda de máquinas + software** = ticket maior por negociação
2. **Receita recorrente** = MRR estável além das vendas pontuais
3. **Lock-in** = academia que usa o app compra mais máquinas Ironberg
4. **Dados** = analytics de uso por máquina (quais são mais usadas)
5. **Alertas automáticos** = app avisa quando aluno está inadimplente ou assinatura expirando

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + React 19 + TailwindCSS 4 |
| Backend | Next.js API Routes + Prisma ORM + PostgreSQL |
| IA | Groq/Llama 3.3 (grátis) + Claude (premium) + Gemini (fallback) |
| 3D | Three.js + React Three Fiber (.glb local) + Sketchfab (anatomia) |
| Postura | MediaPipe Pose Landmarker (256 exercícios, offline) |
| Pagamentos | Mercado Pago (PIX/cartão/boleto) + webhook automático |
| Notificações | Web Push (VAPID) + WhatsApp Cloud API + cron diário |
| Deploy | Vercel (produção) + Coolify (self-hosted backup) |
| PWA | Service Worker + manifest + install prompt + offline |

---

## O Que Já Está Pronto (Março 2026)

- 28 sessões de desenvolvimento (200+ commits)
- 285 exercícios na biblioteca (PT-BR bilíngue)
- 19 máquinas 3D com 8 marcas mapeadas
- 50+ páginas (admin + aluno)
- Checkout Mercado Pago funcional
- CRM com Kanban
- BI Dashboard interativo
- Push notifications
- Broadcast com IA
- Comunidade com ranking
- Import de dados MFIT
- App funcionando em produção: https://victor-app-seven.vercel.app

---

## Próximos Passos

1. **Demo ao vivo** — apresentar app funcionando com máquinas Ironberg 3D
2. **Piloto** — 3 academias parceiras usando por 30 dias grátis
3. **White-label** — rebrand para "Ironberg App" com logo da academia
4. **QR Code** — módulo de leitura QR nas máquinas Ironberg
5. **RAG** — base de conhecimento científico para IA (artigos + manuais)
6. **Contrato** — modelo de revenue share ou licenciamento

---

## Contato

- **Desenvolvimento:** Emmanuel — GitHub: l2versus
- **Personal Trainer:** Victor Oliveira — @victoroliveiraapersonal_
- **Localização:** Fortaleza/CE, Brasil

---

*Documento atualizado em março/2026. Propriedade intelectual de Emmanuel + Victor Oliveira.*
