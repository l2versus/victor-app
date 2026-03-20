#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  VICTOR APP — Script de Setup ao Vivo (Sessao 11)
#  Rodar com: bash scripts/setup-keys-live.sh
# ═══════════════════════════════════════════════════════════

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  VICTOR APP — Setup das API Keys${NC}"
echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo ""

# ─── PASSO 1: GOOGLE AI API KEY ───
echo -e "${CYAN}━━━ PASSO 1/3: Google AI API Key ━━━${NC}"
echo ""
echo -e "${YELLOW}Victor, faca o seguinte:${NC}"
echo "  1. Abra: https://aistudio.google.com/apikey"
echo "  2. Clique 'Create API key'"
echo "  3. Selecione o projeto ou crie um novo"
echo "  4. Copie a key que comeca com 'AIza...'"
echo ""
read -p "Cole a GOOGLE_AI_API_KEY aqui: " GOOGLE_KEY

if [ -z "$GOOGLE_KEY" ]; then
  echo -e "${RED}Key vazia! Pulando...${NC}"
else
  echo -e "${GREEN}✓ Key recebida: ${GOOGLE_KEY:0:10}...${NC}"
fi
echo ""

# ─── PASSO 2: RESEND API KEY ───
echo -e "${CYAN}━━━ PASSO 2/3: Resend API Key (Email) ━━━${NC}"
echo ""
echo -e "${YELLOW}Victor, faca o seguinte:${NC}"
echo "  1. Abra: https://resend.com"
echo "  2. Faca login (pode usar Google)"
echo "  3. Va em 'API Keys' no menu lateral"
echo "  4. Clique 'Create API Key'"
echo "  5. Nome: 'victor-app' / Permission: 'Sending access'"
echo "  6. Copie a key que comeca com 're_...'"
echo ""
read -p "Cole a RESEND_API_KEY aqui: " RESEND_KEY

if [ -z "$RESEND_KEY" ]; then
  echo -e "${RED}Key vazia! Pulando...${NC}"
else
  echo -e "${GREEN}✓ Key recebida: ${RESEND_KEY:0:10}...${NC}"
fi
echo ""

# ─── PASSO 3: MERCADO PAGO WEBHOOK SECRET ───
echo -e "${CYAN}━━━ PASSO 3/3: Mercado Pago Webhook Secret ━━━${NC}"
echo ""
echo -e "${YELLOW}Victor, faca o seguinte:${NC}"
echo "  1. Abra: https://www.mercadopago.com.br/developers/panel/app"
echo "  2. Clique no app 'Victor-app'"
echo "  3. Va em 'Webhooks' no menu lateral"
echo "  4. Procure 'Assinatura secreta'"
echo "  5. Clique no icone de olho/recarregar pra revelar"
echo "  6. Copie o valor"
echo ""
read -p "Cole o MERCADOPAGO_WEBHOOK_SECRET aqui: " MP_SECRET

if [ -z "$MP_SECRET" ]; then
  echo -e "${RED}Key vazia! Pulando...${NC}"
else
  echo -e "${GREEN}✓ Secret recebido: ${MP_SECRET:0:10}...${NC}"
fi
echo ""

# ─── ATUALIZAR .env ───
echo -e "${CYAN}━━━ Atualizando .env local ━━━${NC}"

if [ -n "$GOOGLE_KEY" ]; then
  # Trocar provider para google e adicionar key
  sed -i 's/^AI_PROVIDER=.*/AI_PROVIDER="google"/' .env
  sed -i "s/^GOOGLE_AI_API_KEY=.*/GOOGLE_AI_API_KEY=\"$GOOGLE_KEY\"/" .env
  # Se nao existe GOOGLE_AI_API_KEY, adicionar apos AI_PROVIDER
  if ! grep -q "^GOOGLE_AI_API_KEY=" .env; then
    sed -i "/^AI_PROVIDER=/a GOOGLE_AI_API_KEY=\"$GOOGLE_KEY\"" .env
  fi
  echo -e "${GREEN}✓ GOOGLE_AI_API_KEY adicionada ao .env${NC}"
fi

if [ -n "$RESEND_KEY" ]; then
  sed -i "s/^RESEND_API_KEY=.*/RESEND_API_KEY=\"$RESEND_KEY\"/" .env
  echo -e "${GREEN}✓ RESEND_API_KEY adicionada ao .env${NC}"
fi

if [ -n "$MP_SECRET" ]; then
  sed -i "s/^MERCADOPAGO_WEBHOOK_SECRET=.*/MERCADOPAGO_WEBHOOK_SECRET=\"$MP_SECRET\"/" .env
  echo -e "${GREEN}✓ MERCADOPAGO_WEBHOOK_SECRET adicionado ao .env${NC}"
fi

echo ""

# ─── TESTAR LOCALMENTE ───
echo -e "${CYAN}━━━ Iniciando servidor local pra testar ━━━${NC}"
echo ""
echo -e "${YELLOW}Checklist de teste (marcar cada um):${NC}"
echo ""
echo "  □ 1. Landing page: http://localhost:3000"
echo "     → Hero, planos, FAQ, depoimentos carregam?"
echo ""
echo "  □ 2. Victor Virtual (chat na landing):"
echo "     → Clique no balao no canto inferior direito"
echo "     → Mande 'Ola' → IA responde?"
echo ""
echo "  □ 3. Login admin: victor@teste.com / 123456"
echo "     → Dashboard carrega com stats?"
echo ""
echo "  □ 4. Login aluno: emmanuel@teste.com / admin123"
echo "     → /today carrega (treino ou rest day)?"
echo "     → /chat: mande 'como melhorar agachamento' → IA responde?"
echo "     → /posture: tela de postura carrega? (Elite)"
echo "     → /history: heatmap + stats?"
echo "     → /profile: dados do aluno?"
echo ""
echo "  □ 5. Checkout sandbox:"
echo "     → Landing → clique em plano Pro Semestral"
echo "     → Preencha: nome, email, telefone"
echo "     → Clique 'Pagar' → vai pro Mercado Pago sandbox?"
echo "     → Use: TESTUSER7056113908042921725 / JsNwK0x8vI"
echo "     → Simule pagamento aprovado"
echo "     → Verifique: usuario criado? email enviado?"
echo ""

read -p "Pressione ENTER pra iniciar o servidor dev..." _
echo ""
echo -e "${GREEN}Rodando: npx next dev${NC}"
echo -e "${YELLOW}Acesse: http://localhost:3000${NC}"
echo ""
npx next dev
