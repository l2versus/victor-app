import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PLANS = [
  // ═══ ESSENCIAL ═══
  { name: "Essencial", slug: "essencial_monthly",    interval: "MONTHLY",    price: 199.90, hasAI: false, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: 3, description: "Plano básico com app e histórico de treinos" },
  { name: "Essencial", slug: "essencial_quarterly",  interval: "QUARTERLY",  price: 169.92, hasAI: false, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: 3, description: "Plano básico com app e histórico de treinos" },
  { name: "Essencial", slug: "essencial_semiannual", interval: "SEMIANNUAL", price: 149.93, hasAI: false, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: 3, description: "Plano básico com app e histórico de treinos" },
  { name: "Essencial", slug: "essencial_annual",     interval: "ANNUAL",     price: 119.94, hasAI: false, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: 3, description: "Plano básico com app e histórico de treinos" },

  // ═══ PRO ═══
  { name: "Pro", slug: "pro_monthly",    interval: "MONTHLY",    price: 299.90, hasAI: true, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: null, description: "Treinos ilimitados + assistente virtual IA + análise inteligente" },
  { name: "Pro", slug: "pro_quarterly",  interval: "QUARTERLY",  price: 254.92, hasAI: true, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: null, description: "Treinos ilimitados + assistente virtual IA + análise inteligente" },
  { name: "Pro", slug: "pro_semiannual", interval: "SEMIANNUAL", price: 224.93, hasAI: true, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: null, description: "Treinos ilimitados + assistente virtual IA + análise inteligente" },
  { name: "Pro", slug: "pro_annual",     interval: "ANNUAL",     price: 179.94, hasAI: true, hasPostureCamera: false, hasVipGroup: false, hasNutrition: false, maxSessionsWeek: null, description: "Treinos ilimitados + assistente virtual IA + análise inteligente" },

  // ═══ ELITE ═══
  { name: "Elite", slug: "elite_monthly",    interval: "MONTHLY",    price: 499.90, hasAI: true, hasPostureCamera: true, hasVipGroup: true, hasNutrition: true, maxSessionsWeek: null, description: "Tudo do Pro + correção postural IA + nutrição + grupo VIP + WhatsApp direto" },
  { name: "Elite", slug: "elite_quarterly",  interval: "QUARTERLY",  price: 424.92, hasAI: true, hasPostureCamera: true, hasVipGroup: true, hasNutrition: true, maxSessionsWeek: null, description: "Tudo do Pro + correção postural IA + nutrição + grupo VIP + WhatsApp direto" },
  { name: "Elite", slug: "elite_semiannual", interval: "SEMIANNUAL", price: 374.93, hasAI: true, hasPostureCamera: true, hasVipGroup: true, hasNutrition: true, maxSessionsWeek: null, description: "Tudo do Pro + correção postural IA + nutrição + grupo VIP + WhatsApp direto" },
  { name: "Elite", slug: "elite_annual",     interval: "ANNUAL",     price: 299.94, hasAI: true, hasPostureCamera: true, hasVipGroup: true, hasNutrition: true, maxSessionsWeek: null, description: "Tudo do Pro + correção postural IA + nutrição + grupo VIP + WhatsApp direto" },
];

async function main() {
  console.log("🔍 Buscando trainer...");

  // Find the trainer (Victor)
  const trainer = await prisma.trainerProfile.findFirst();
  if (!trainer) {
    console.error("❌ Nenhum trainer encontrado no banco! Crie uma conta admin primeiro.");
    return;
  }

  console.log(`✅ Trainer encontrado: ID=${trainer.id}`);
  console.log(`📋 Inserindo ${PLANS.length} planos...\n`);

  let created = 0;
  let skipped = 0;

  for (const plan of PLANS) {
    // Check if slug already exists
    const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
    if (existing) {
      console.log(`  ⏭ ${plan.slug} já existe — pulando`);
      skipped++;
      continue;
    }

    await prisma.plan.create({
      data: {
        trainerId: trainer.id,
        name: plan.name,
        slug: plan.slug,
        interval: plan.interval as "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL",
        price: plan.price,
        active: true,
        hasAI: plan.hasAI,
        hasPostureCamera: plan.hasPostureCamera,
        hasVipGroup: plan.hasVipGroup,
        hasNutrition: plan.hasNutrition,
        maxSessionsWeek: plan.maxSessionsWeek,
        description: plan.description,
      },
    });

    console.log(`  ✅ ${plan.slug} — R$ ${plan.price.toFixed(2)}`);
    created++;
  }

  console.log(`\n🎉 Pronto! ${created} criados, ${skipped} já existiam.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
