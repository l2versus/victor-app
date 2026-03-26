// ═══════════════════════════════════════════════════════════════════════════════
// TODO: Este arquivo usa MOCK_POSTS. Quando o modelo BlogPost existir no
// Prisma (ver comentário em /blog/page.tsx), substituir por queries reais:
//
// const post = await prisma.blogPost.findUnique({
//   where: { slug, status: "PUBLISHED" },
// })
//
// E adicionar generateStaticParams() para ISR:
// export async function generateStaticParams() {
//   const posts = await prisma.blogPost.findMany({
//     where: { status: "PUBLISHED" },
//     select: { slug: true },
//   })
//   return posts.map(p => ({ slug: p.slug }))
// }
//
// SEGURANCA: Quando usar conteúdo do banco de dados, sanitizar o HTML
// com uma lib como DOMPurify ou sanitize-html antes de renderizar.
// O conteúdo atual é mock estático e seguro.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { BRAND } from "@/lib/branding"
import { ArrowLeft, Calendar, Tag, BookOpen, User } from "lucide-react"

// ── Mock data — mesma base da listagem ─────────────────────────────────────
interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string | null
  category: string
  publishedAt: string
}

const MOCK_POSTS: BlogPost[] = [
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
    coverImage: null,
    category: "Treino",
    publishedAt: "2026-03-20",
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
    coverImage: null,
    category: "Saúde",
    publishedAt: "2026-03-15",
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
    coverImage: null,
    category: "Nutrição",
    publishedAt: "2026-03-10",
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
    coverImage: null,
    category: "Treino",
    publishedAt: "2026-03-05",
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
    coverImage: null,
    category: "Nutrição",
    publishedAt: "2026-02-28",
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
<li>Use o app Victor Personal para corrigir postura com câmera IA</li>
</ul>`,
    coverImage: null,
    category: "Saúde",
    publishedAt: "2026-02-20",
  },
]

function getPostBySlug(slug: string): BlogPost | undefined {
  return MOCK_POSTS.find((p) => p.slug === slug)
}

// ── SEO metadata ───────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return { title: "Artigo não encontrado" }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${BRAND.appUrl}/blog/${post.slug}`,
      siteName: BRAND.appName,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [BRAND.trainerName],
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

const CATEGORY_COLORS: Record<string, string> = {
  Treino: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Nutrição": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "Saúde": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Lifestyle: "bg-amber-500/15 text-amber-400 border-amber-500/25",
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // SEGURANCA: O conteúdo abaixo vem de dados mock estáticos definidos neste
  // mesmo arquivo. Quando migrar para dados do banco (Prisma BlogPost),
  // sanitizar o HTML com sanitize-html ou DOMPurify antes de renderizar.
  const sanitizedContent = post.content

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao Blog</span>
          </Link>
          <Link href="/" className="text-xs text-neutral-500 hover:text-white transition-colors">
            {BRAND.appName}
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* Cover image */}
        {post.coverImage && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8 relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[post.category] ?? "bg-neutral-500/15 text-neutral-400 border-neutral-500/25"}`}
          >
            <Tag className="w-3 h-3" />
            {post.category}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Calendar className="w-3 h-3" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <User className="w-3 h-3" />
            {BRAND.trainerName}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 border-l-2 border-amber-500/40 pl-4">
          {post.excerpt}
        </p>

        {/* Content — styled manually since @tailwindcss/typography is not installed */}
        <div
          className="blog-content max-w-none text-neutral-300 leading-relaxed
            [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_strong]:text-white [&_strong]:font-semibold
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5
            [&_li]:leading-relaxed
            [&_a]:text-amber-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-amber-300
            [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-400
            [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-amber-300"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-amber-600/5 to-orange-600/5 p-6 sm:p-8 text-center space-y-4">
          <BookOpen className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            Quer treinos personalizados?
          </h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            Com o {BRAND.appName}, você tem treinos sob medida, acompanhamento
            com IA e evolução real. Comece agora!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500 transition-all"
            >
              Criar Conta Grátis
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.1] text-neutral-300 text-sm hover:border-white/[0.2] hover:text-white transition-all"
            >
              Ver Mais Artigos
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-neutral-600">
            {BRAND.appName} &mdash; {BRAND.trainerName} &bull;{" "}
            {BRAND.trainerTitle}
          </p>
        </div>
      </footer>
    </div>
  )
}
