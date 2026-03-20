#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Valida se as API keys estao configuradas e funcionando
#  Rodar com: bash scripts/validate-keys.sh
# ═══════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${BOLD}Validando API Keys do .env...${NC}"
echo ""

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
else
  echo -e "${RED}Arquivo .env nao encontrado!${NC}"
  exit 1
fi

PASS=0
FAIL=0

# 1. Google AI
echo -n "  Google AI API Key... "
if [ -n "$GOOGLE_AI_API_KEY" ] && [ "$GOOGLE_AI_API_KEY" != '""' ]; then
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_AI_API_KEY" 2>/dev/null)
  if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Valida (listou modelos)${NC}"
    PASS=$((PASS+1))
  else
    echo -e "${RED}✗ HTTP $RESPONSE — key invalida ou sem permissao${NC}"
    FAIL=$((FAIL+1))
  fi
else
  echo -e "${YELLOW}⚠ Nao configurada${NC}"
  FAIL=$((FAIL+1))
fi

# 2. Resend
echo -n "  Resend API Key... "
if [ -n "$RESEND_API_KEY" ] && [ "$RESEND_API_KEY" != '""' ]; then
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    "https://api.resend.com/domains" 2>/dev/null)
  if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Valida (autenticou)${NC}"
    PASS=$((PASS+1))
  else
    echo -e "${RED}✗ HTTP $RESPONSE — key invalida${NC}"
    FAIL=$((FAIL+1))
  fi
else
  echo -e "${YELLOW}⚠ Nao configurada${NC}"
  FAIL=$((FAIL+1))
fi

# 3. Mercado Pago Webhook Secret
echo -n "  MP Webhook Secret... "
if [ -n "$MERCADOPAGO_WEBHOOK_SECRET" ] && [ "$MERCADOPAGO_WEBHOOK_SECRET" != '""' ]; then
  echo -e "${GREEN}✓ Configurado (${#MERCADOPAGO_WEBHOOK_SECRET} chars)${NC}"
  PASS=$((PASS+1))
else
  echo -e "${YELLOW}⚠ Nao configurado (webhooks sem verificacao)${NC}"
  FAIL=$((FAIL+1))
fi

# 4. Mercado Pago Access Token
echo -n "  MP Access Token... "
if [ -n "$MERCADOPAGO_ACCESS_TOKEN" ] && [ "$MERCADOPAGO_ACCESS_TOKEN" != '""' ]; then
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \
    "https://api.mercadopago.com/v1/payment_methods" 2>/dev/null)
  if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Valido (listou metodos de pagamento)${NC}"
    PASS=$((PASS+1))
  else
    echo -e "${RED}✗ HTTP $RESPONSE${NC}"
    FAIL=$((FAIL+1))
  fi
else
  echo -e "${RED}✗ Nao configurado${NC}"
  FAIL=$((FAIL+1))
fi

# 5. Database
echo -n "  Database... "
if [ -n "$DATABASE_URL" ]; then
  echo -e "${GREEN}✓ Configurado${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}✗ DATABASE_URL vazio${NC}"
  FAIL=$((FAIL+1))
fi

echo ""
echo -e "${BOLD}Resultado: ${GREEN}$PASS OK${NC} / ${RED}$FAIL falhas${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}${BOLD}Todas as keys estao validas! Pronto pra deploy.${NC}"
else
  echo -e "${YELLOW}Corrija as keys acima antes de prosseguir.${NC}"
fi
echo ""
