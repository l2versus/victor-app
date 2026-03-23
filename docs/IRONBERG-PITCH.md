# Proposta Comercial — Victor App + Ironberg

> Transformar a venda de equipamentos em receita recorrente com software inteligente.

---

## O Problema

Academias compram máquinas Ironberg (venda única) e depois não há relação contínua. Personal trainers usam papel, planilhas ou apps genéricos (MFIT) que não conhecem as máquinas da academia.

## A Solução

**Victor App** — plataforma de treinamento inteligente que já integra **52 máquinas Ironberg** com modelos 3D, análise postural por câmera e IA.

Cada máquina Ironberg ganha um **QR Code** que, ao ser escaneado pelo aluno, abre:
- Modelo 3D interativo da máquina
- Exercícios possíveis com instruções detalhadas
- Correção postural em tempo real pela câmera (IA exclusiva)
- Vídeos de execução correta

---

## Diferenciais Exclusivos (nenhum concorrente tem)

### 1. Correção Postural por IA (MediaPipe)
- 256 exercícios analisados em tempo real pela câmera do celular
- Feedback visual: ângulos, alinhamento, amplitude
- Funciona offline (processamento no device)
- **Valor:** reduz lesões, diferencia a academia

### 2. 52 Máquinas Ironberg em 3D
- Modelos Three.js interativos (rotacionar, zoom)
- 8 marcas: Hammer Strength, Hoist ROC-IT, Nautilus, Life Fitness, Cybex, Matrix, Panatta, Stark Strong
- **Valor:** aluno entende a máquina antes de usar

### 3. Prescrição por Voz
- Personal fala: "Supino 4 séries de 10 com 60kg"
- IA transcreve e monta a ficha automaticamente
- Matching com 285 exercícios da biblioteca
- **Valor:** economiza 80% do tempo de prescrição

### 4. IA Dual (Gemini + Claude)
- Chat inteligente que conhece o aluno (peso, altura, histórico, restrições, nutrição)
- Gera treinos personalizados automaticamente
- Analisa anamnese e sugere exercícios seguros
- **Valor:** personal atende mais alunos com qualidade

### 5. Broadcast WhatsApp com IA
- Mensagens em massa com texto gerado por IA
- Filtros: gênero, idade, status, individual
- Ocasiões: aniversário, motivacional, promoção, retorno
- **Valor:** engajamento e retenção automáticos

### 6. Spotify Integrado
- Aluno treina ouvindo suas playlists
- OAuth nativo, mini player na tela de treino
- **Valor:** experiência premium

---

## Comparativo vs MFIT Personal

| Feature | MFIT | Victor App | Vantagem |
|---------|------|-----------|----------|
| Correção postural IA | Não tem | 256 exercícios | **EXCLUSIVO** |
| Máquinas 3D | Não tem | 52 Ironberg | **EXCLUSIVO** |
| Prescrição por voz | Não tem | Web Speech + IA | **EXCLUSIVO** |
| Body Scan IA | Não tem | Shape + ratios | **EXCLUSIVO** |
| Spotify no treino | Não tem | OAuth + player | **EXCLUSIVO** |
| Broadcast WhatsApp IA | Manual | IA + filtros | **SUPERIOR** |
| Chat IA contextual | Básico | Claude + histórico completo | **SUPERIOR** |
| Treinos com vídeo/foto | Sim | Sim + 3D | **SUPERIOR** |
| Evolução de cargas | Sim | Sim + gráficos | **PAR** |
| PDF treino | Sim | Sim | **PAR** |

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

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + React 19 + TailwindCSS |
| Backend | Next.js API + Prisma + PostgreSQL |
| IA | Claude (análise) + Gemini (geração) |
| 3D | Three.js + Sketchfab (.glb) |
| Postura | MediaPipe Pose Landmarker |
| Pagamentos | Mercado Pago (PIX/cartão/boleto) |
| Notificações | Web Push + WhatsApp Cloud API |
| Deploy | Coolify (self-hosted) ou Vercel |

---

## Próximos Passos

1. **Demo ao vivo** — apresentar app funcionando com máquinas Ironberg 3D
2. **Piloto** — 3 academias parceiras usando por 30 dias grátis
3. **White-label** — sistema multi-tenant com marca da academia
4. **QR Code** — módulo de leitura QR nas máquinas Ironberg
5. **Contrato** — modelo de revenue share ou licenciamento

---

## Contato

- **Desenvolvimento:** Emmanuel — GitHub: l2versus
- **Personal Trainer:** Victor Oliveira — @victoroliveiraapersonal_
- **Localização:** Fortaleza/CE, Brasil

---

*Documento gerado em março/2026. Propriedade intelectual de Emmanuel + Ironberg.*
