import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════
// B2C Plans — Vendidos diretamente ao consumidor (pessoa física)
// Free Trial: R$0 (3 dias de acesso total)
// Premium: R$19.90/mês (trimestral -15%, semestral -25%, anual -40%)
// Pro: R$34.90/mês (trimestral -15%, semestral -25%, anual -40%)
// Full: R$59.90/mês (trimestral -15%, semestral -25%, anual -40%)
// ═══════════════════════════════════════

const B2C_PLANS = [
  // ═══ FREE TRIAL ═══
  {
    name: "Free",
    slug: "b2c-free-trial",
    interval: "MONTHLY" as const,
    price: 0,
    hasAI: false,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: 3,
    description: "3 dias de acesso completo grátis. Sem cartão de crédito.",
  },

  // ═══ PREMIUM ═══
  {
    name: "Premium",
    slug: "b2c-premium-monthly",
    interval: "MONTHLY" as const,
    price: 19.90,
    hasAI: false,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: null,
    description: "Treinos ilimitados, comunidade completa, Spotify e marketplace.",
  },
  {
    name: "Premium",
    slug: "b2c-premium-quarterly",
    interval: "QUARTERLY" as const,
    price: 50.92,
    hasAI: false,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: null,
    description: "Treinos ilimitados, comunidade completa, Spotify e marketplace.",
  },
  {
    name: "Premium",
    slug: "b2c-premium-annual",
    interval: "ANNUAL" as const,
    price: 143.28,
    hasAI: false,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: null,
    description: "Treinos ilimitados, comunidade completa, Spotify e marketplace.",
  },

  // ═══ PRO ═══
  {
    name: "Pro",
    slug: "b2c-pro-monthly",
    interval: "MONTHLY" as const,
    price: 34.90,
    hasAI: true,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: null,
    description: "Tudo do Premium + IA chat, gerador de treinos IA, body scan e suporte prioritário.",
  },
  {
    name: "Pro",
    slug: "b2c-pro-quarterly",
    interval: "QUARTERLY" as const,
    price: 89.00,
    hasAI: true,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: null,
    description: "Tudo do Premium + IA chat, gerador de treinos IA, body scan e suporte prioritário.",
  },
  {
    name: "Pro",
    slug: "b2c-pro-annual",
    interval: "ANNUAL" as const,
    price: 251.28,
    hasAI: true,
    hasPostureCamera: false,
    hasVipGroup: false,
    hasNutrition: false,
    maxSessionsWeek: null,
    description: "Tudo do Premium + IA chat, gerador de treinos IA, body scan e suporte prioritário.",
  },

  // ═══ FULL ═══
  {
    name: "Full",
    slug: "b2c-full-monthly",
    interval: "MONTHLY" as const,
    price: 59.90,
    hasAI: true,
    hasPostureCamera: true,
    hasVipGroup: true,
    hasNutrition: true,
    maxSessionsWeek: null,
    description: "Acesso total: câmera postural IA, nutrição IA, bot WhatsApp e tudo do Pro.",
  },
  {
    name: "Full",
    slug: "b2c-full-quarterly",
    interval: "QUARTERLY" as const,
    price: 152.75,
    hasAI: true,
    hasPostureCamera: true,
    hasVipGroup: true,
    hasNutrition: true,
    maxSessionsWeek: null,
    description: "Acesso total: câmera postural IA, nutrição IA, bot WhatsApp e tudo do Pro.",
  },
  {
    name: "Full",
    slug: "b2c-full-annual",
    interval: "ANNUAL" as const,
    price: 431.28,
    hasAI: true,
    hasPostureCamera: true,
    hasVipGroup: true,
    hasNutrition: true,
    maxSessionsWeek: null,
    description: "Acesso total: câmera postural IA, nutrição IA, bot WhatsApp e tudo do Pro.",
  },
];

async function main() {
  console.log("B2C Plans Seed — Planos para consumidor final\n");

  // Find the trainer (needed for Plan.trainerId FK)
  const trainer = await prisma.trainerProfile.findFirst();
  if (!trainer) {
    console.error("Nenhum trainer encontrado no banco! Crie uma conta admin primeiro.");
    return;
  }

  console.log(`Trainer encontrado: ID=${trainer.id}`);
  console.log(`Inserindo ${B2C_PLANS.length} planos B2C...\n`);

  let created = 0;
  let skipped = 0;

  for (const plan of B2C_PLANS) {
    // Check if slug already exists
    const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
    if (existing) {
      console.log(`  [skip] ${plan.slug} ja existe`);
      skipped++;
      continue;
    }

    await prisma.plan.create({
      data: {
        trainerId: trainer.id,
        name: plan.name,
        slug: plan.slug,
        interval: plan.interval,
        price: plan.price,
        active: true,
        isB2C: true,
        hasAI: plan.hasAI,
        hasPostureCamera: plan.hasPostureCamera,
        hasVipGroup: plan.hasVipGroup,
        hasNutrition: plan.hasNutrition,
        maxSessionsWeek: plan.maxSessionsWeek,
        description: plan.description,
      },
    });

    const priceStr = plan.price === 0 ? "GRATIS" : `R$ ${plan.price.toFixed(2)}`;
    console.log(`  [ok] ${plan.slug} — ${priceStr}`);
    created++;
  }

  console.log(`\nPronto! ${created} criados, ${skipped} ja existiam.`);
}

main()
  .catch((e) => {
    console.error("Erro:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
