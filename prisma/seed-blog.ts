import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const blogPosts = [
  {
    slug: "como-ganhar-massa-muscular",
    title: "Como Ganhar Massa Muscular: Guia Completo",
    excerpt:
      "Descubra as melhores estratégias de treino e alimentação para hipertrofia muscular, com base na ciência do exercício.",
    content: `<h2>Introdução</h2>
<p>Ganhar massa muscular é um dos objetivos mais comuns entre praticantes de musculação. Mas o caminho até a hipertrofia vai muito além de simplesmente levantar peso — envolve estratégia de treino, nutrição adequada, descanso e consistência.</p>

<h2>1. Princípios do Treino para Hipertrofia</h2>
<p>Para estimular o crescimento muscular, é fundamental trabalhar com <strong>sobrecarga progressiva</strong>. Isso significa aumentar gradualmente o volume, a carga ou a intensidade dos seus treinos ao longo do tempo.</p>
<ul>
<li><strong>Volume:</strong> 10-20 séries por grupo muscular por semana</li>
<li><strong>Repetições:</strong> 6-12 reps na maioria dos exercícios</li>
<li><strong>Descanso entre séries:</strong> 60-120 segundos</li>
<li><strong>Frequência:</strong> Cada grupo muscular 2x por semana</li>
</ul>

<h2>2. Alimentação para Hipertrofia</h2>
<p>Sem um superávit calórico adequado, é muito difícil construir massa muscular. O ideal é consumir de <strong>300 a 500 kcal acima</strong> do seu gasto energético diário.</p>
<ul>
<li><strong>Proteína:</strong> 1.6 a 2.2g por kg de peso corporal</li>
<li><strong>Carboidratos:</strong> 4-7g por kg (combustível para o treino)</li>
<li><strong>Gorduras:</strong> 0.8-1.2g por kg (hormônios e saúde)</li>
</ul>

<h2>3. Recuperação</h2>
<p>O músculo cresce durante o descanso, não durante o treino. Priorize:</p>
<ul>
<li>7-9 horas de sono por noite</li>
<li>Gerenciamento de estresse</li>
<li>Dias de descanso adequados entre sessões do mesmo grupo</li>
</ul>

<h2>Conclusão</h2>
<p>A hipertrofia é um processo que demanda paciência e consistência. Combine treino inteligente, alimentação estratégica e recuperação adequada para resultados reais e duradouros.</p>`,
    category: "Treino",
    tags: ["hipertrofia", "musculação", "treino"],
    publishedAt: new Date("2026-03-20"),
  },
  {
    slug: "importancia-do-sono-para-treino",
    title: "A Importância do Sono para seus Resultados",
    excerpt:
      "Entenda como a qualidade do sono impacta diretamente seus ganhos na academia e como melhorar sua rotina noturna.",
    content: `<h2>Por que o Sono é Essencial?</h2>
<p>Durante o sono profundo, seu corpo libera <strong>GH (hormônio do crescimento)</strong>, repara tecidos musculares e consolida a memória motora dos exercícios realizados. Dormir mal compromete diretamente seus resultados.</p>

<h2>Impactos da Privação de Sono</h2>
<ul>
<li>Redução de até 30% na síntese proteica muscular</li>
<li>Aumento do cortisol (hormônio catabólico)</li>
<li>Maior propensão a lesões</li>
<li>Redução da motivação e performance</li>
</ul>

<h2>Dicas para Melhorar seu Sono</h2>
<ul>
<li>Mantenha horários regulares de dormir e acordar</li>
<li>Evite telas 1 hora antes de dormir</li>
<li>Ambiente escuro e fresco (18-22°C)</li>
<li>Evite cafeína após as 14h</li>
<li>Considere suplementar com magnésio</li>
</ul>`,
    category: "Saúde",
    tags: ["sono", "recuperação", "saúde"],
    publishedAt: new Date("2026-03-15"),
  },
  {
    slug: "mitos-sobre-emagrecimento",
    title: "5 Mitos sobre Emagrecimento que Você Precisa Parar de Acreditar",
    excerpt:
      "Desmistificamos as crenças mais comuns que atrapalham seu processo de perda de gordura.",
    content: `<h2>Mito 1: Carboidrato Engorda</h2>
<p>O que engorda é o <strong>excesso calórico</strong>, não o carboidrato em si. Carboidratos são a principal fonte de energia para treinos intensos.</p>

<h2>Mito 2: Comer à Noite Engorda Mais</h2>
<p>O horário da refeição tem muito menos impacto do que o total calórico do dia. O que importa é o balanço energético de 24 horas.</p>

<h2>Mito 3: Aeróbico em Jejum Queima Mais Gordura</h2>
<p>Estudos mostram que a perda de gordura total é semelhante, independente de estar em jejum ou alimentado. O importante é a consistência.</p>

<h2>Mito 4: Suplementos Termogênicos Emagrecem</h2>
<p>O efeito de termogênicos é mínimo (30-80 kcal/dia). Nenhum suplemento substitui déficit calórico e exercício regular.</p>

<h2>Mito 5: Dietas Restritivas são o Melhor Caminho</h2>
<p>Dietas muito restritivas levam ao efeito sanfona. O ideal é um déficit moderado (300-500 kcal) com alimentação variada e sustentável.</p>`,
    category: "Nutrição",
    tags: ["emagrecimento", "nutrição", "mitos"],
    publishedAt: new Date("2026-03-10"),
  },
  {
    slug: "treino-de-pernas-completo",
    title: "Treino de Pernas Completo: Do Iniciante ao Avançado",
    excerpt:
      "Montamos uma progressão completa de treino de membros inferiores com os melhores exercícios para cada nível.",
    content: `<h2>Iniciante (0-6 meses)</h2>
<ul>
<li>Leg Press 45° — 3x12</li>
<li>Cadeira Extensora — 3x15</li>
<li>Mesa Flexora — 3x12</li>
<li>Panturrilha em Pé — 3x15</li>
</ul>

<h2>Intermediário (6-18 meses)</h2>
<ul>
<li>Agachamento Livre — 4x8-10</li>
<li>Leg Press 45° — 3x12</li>
<li>Stiff — 3x10</li>
<li>Cadeira Extensora — 3x12</li>
<li>Mesa Flexora — 3x12</li>
<li>Panturrilha Sentado — 4x15</li>
</ul>

<h2>Avançado (18+ meses)</h2>
<ul>
<li>Agachamento Livre — 5x6-8</li>
<li>Agachamento Búlgaro — 3x10</li>
<li>Leg Press 45° — 4x10</li>
<li>Stiff Romeno — 4x8</li>
<li>Cadeira Extensora (drop set) — 3x12+8+6</li>
<li>Mesa Flexora — 3x10</li>
<li>Panturrilha em Pé — 5x12</li>
</ul>`,
    category: "Treino",
    tags: ["pernas", "treino", "musculação"],
    publishedAt: new Date("2026-03-05"),
  },
  {
    slug: "suplementos-que-funcionam",
    title: "Suplementos que Realmente Funcionam (e os que Não Valem a Pena)",
    excerpt:
      "Uma análise baseada em evidências dos suplementos mais populares do mercado fitness.",
    content: `<h2>Funcionam (Evidência Forte)</h2>
<ul>
<li><strong>Creatina Monohidratada:</strong> 3-5g/dia. Aumenta força, potência e volume muscular.</li>
<li><strong>Whey Protein:</strong> Prático para atingir sua meta proteica diária.</li>
<li><strong>Cafeína:</strong> 3-6mg/kg. Melhora performance e foco no treino.</li>
</ul>

<h2>Podem Ajudar (Evidência Moderada)</h2>
<ul>
<li><strong>Beta-Alanina:</strong> 3-6g/dia. Pode melhorar resistência em séries longas.</li>
<li><strong>Vitamina D:</strong> Se você tem deficiência (muito comum no Brasil).</li>
<li><strong>Ômega-3:</strong> Anti-inflamatório, bom para saúde geral.</li>
</ul>

<h2>Não Valem a Pena</h2>
<ul>
<li><strong>BCAAs:</strong> Se você já consome proteína suficiente, são desnecessários.</li>
<li><strong>Glutamina:</strong> Sem benefício comprovado para hipertrofia em pessoas saudáveis.</li>
<li><strong>Tribulus Terrestris:</strong> Não aumenta testosterona em humanos.</li>
</ul>`,
    category: "Nutrição",
    tags: ["suplementos", "nutrição", "whey", "creatina"],
    publishedAt: new Date("2026-02-28"),
  },
  {
    slug: "postura-no-dia-a-dia",
    title: "Correção Postural: Exercícios para o Dia a Dia",
    excerpt:
      "Exercícios simples que você pode fazer em casa para melhorar sua postura e prevenir dores.",
    content: `<h2>Por que a Postura Importa?</h2>
<p>Passamos horas sentados e a musculatura responsável pela estabilização postural enfraquece. Isso causa dores nas costas, ombros e pescoço, além de prejudicar a execução dos exercícios na academia.</p>

<h2>Exercícios Diários (10 minutos)</h2>
<ul>
<li><strong>Cat-Cow:</strong> 10 repetições lentas. Mobilidade da coluna.</li>
<li><strong>Prancha Frontal:</strong> 3x30s. Estabilização do core.</li>
<li><strong>Retração Escapular:</strong> 3x15. Fortalece região entre as escápulas.</li>
<li><strong>Alongamento de Peitoral na Porta:</strong> 3x30s cada lado.</li>
<li><strong>Ponte de Glúteos:</strong> 3x15. Ativa glúteos e estabiliza lombar.</li>
</ul>

<h2>Dicas para o Dia a Dia</h2>
<ul>
<li>Ajuste a altura da tela do computador na linha dos olhos</li>
<li>Levante a cada 45 minutos para se movimentar</li>
<li>Pratique exercícios de mobilidade diariamente</li>
</ul>`,
    category: "Saúde",
    tags: ["postura", "saúde", "exercícios"],
    publishedAt: new Date("2026-02-20"),
  },
];

async function main() {
  // Buscar primeiro trainer
  const trainer = await prisma.trainerProfile.findFirst();
  if (!trainer) {
    console.log("Nenhum trainer encontrado. Crie um trainer antes de rodar o seed de blog.");
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.blogPost.create({
      data: {
        trainerId: trainer.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        status: "PUBLISHED",
        publishedAt: post.publishedAt,
      },
    });
    created++;
  }

  console.log(`Blog seed: ${created} criados, ${skipped} já existiam (${blogPosts.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
