// ═══════════════════════════════════════════════════════════════════════════════
// TODO: Blog público requer modelo BlogPost no Prisma. Adicionar ao schema:
//
// model BlogPost {
//   id          String   @id @default(cuid())
//   trainerId   String
//   slug        String   @unique
//   title       String
//   excerpt     String?
//   content     String   // markdown ou HTML
//   coverImage  String?  // URL da thumbnail/capa
//   category    String?  // ex: "treino", "nutrição", "lifestyle"
//   tags        String[]
//   status      BlogPostStatus @default(DRAFT)
//   publishedAt DateTime?
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt
//
//   trainer     TrainerProfile @relation(fields: [trainerId], references: [id])
//
//   @@index([trainerId])
//   @@index([status, publishedAt])
//   @@index([slug])
// }
//
// enum BlogPostStatus {
//   DRAFT
//   PUBLISHED
//   ARCHIVED
// }
//
// Após criar o modelo, rodar: npx prisma migrate dev --name add-blog-posts
// Depois substituir MOCK_POSTS abaixo por queries reais do Prisma.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BRAND } from "@/lib/branding"
import { BookOpen, ArrowLeft, Calendar, Tag } from "lucide-react"

export const metadata: Metadata = {
  title: `Blog — ${BRAND.appName}`,
  description: `Artigos sobre treino, nutrição e saúde por ${BRAND.trainerName}. Dicas de personal trainer para alcançar seus objetivos.`,
  openGraph: {
    title: `Blog — ${BRAND.appName}`,
    description: `Artigos sobre treino, nutrição e saúde por ${BRAND.trainerName}.`,
    url: `${BRAND.appUrl}/blog`,
    siteName: BRAND.appName,
    type: "website",
  },
}

// ── Mock data — substituir por query Prisma quando modelo existir ──────────
interface BlogPostPreview {
  slug: string
  title: string
  excerpt: string
  coverImage: string | null
  category: string
  publishedAt: string
}

const MOCK_POSTS: BlogPostPreview[] = [
  {
    slug: "como-ganhar-massa-muscular",
    title: "Como Ganhar Massa Muscular: Guia Completo",
    excerpt:
      "Descubra as melhores estratégias de treino e alimentação para hipertrofia muscular, com base na ciência do exercício.",
    coverImage: null,
    category: "Treino",
    publishedAt: "2026-03-20",
  },
  {
    slug: "importancia-do-sono-para-treino",
    title: "A Importância do Sono para seus Resultados",
    excerpt:
      "Entenda como a qualidade do sono impacta diretamente seus ganhos na academia e como melhorar sua rotina noturna.",
    coverImage: null,
    category: "Saúde",
    publishedAt: "2026-03-15",
  },
  {
    slug: "mitos-sobre-emagrecimento",
    title: "5 Mitos sobre Emagrecimento que Você Precisa Parar de Acreditar",
    excerpt:
      "Desmistificamos as crenças mais comuns que atrapalham seu processo de perda de gordura.",
    coverImage: null,
    category: "Nutrição",
    publishedAt: "2026-03-10",
  },
  {
    slug: "treino-de-pernas-completo",
    title: "Treino de Pernas Completo: Do Iniciante ao Avançado",
    excerpt:
      "Montamos uma progressão completa de treino de membros inferiores com os melhores exercícios para cada nível.",
    coverImage: null,
    category: "Treino",
    publishedAt: "2026-03-05",
  },
  {
    slug: "suplementos-que-funcionam",
    title: "Suplementos que Realmente Funcionam (e os que Não Valem a Pena)",
    excerpt:
      "Uma análise baseada em evidências dos suplementos mais populares do mercado fitness.",
    coverImage: null,
    category: "Nutrição",
    publishedAt: "2026-02-28",
  },
  {
    slug: "postura-no-dia-a-dia",
    title: "Correção Postural: Exercícios para o Dia a Dia",
    excerpt:
      "Exercícios simples que você pode fazer em casa para melhorar sua postura e prevenir dores.",
    coverImage: null,
    category: "Saúde",
    publishedAt: "2026-02-20",
  },
]

// TODO: substituir por query real:
// const posts = await prisma.blogPost.findMany({
//   where: { status: "PUBLISHED" },
//   orderBy: { publishedAt: "desc" },
//   select: { slug: true, title: true, excerpt: true, coverImage: true, category: true, publishedAt: true },
// })

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const CATEGORY_COLORS: Record<string, string> = {
  Treino: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Nutrição: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Saúde: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Lifestyle: "bg-amber-500/15 text-amber-400 border-amber-500/25",
}

export default function BlogPage() {
  const posts = MOCK_POSTS

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{BRAND.appName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span className="text-white font-semibold text-sm">Blog</span>
          </div>
          <Link
            href="/login"
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Blog {BRAND.trainerName.split(" ")[0]}
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto">
            Artigos sobre treino, nutrição e saúde para você alcançar seus
            objetivos com conhecimento.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500">Nenhum artigo publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden hover:border-white/[0.12] transition-all hover:shadow-lg hover:shadow-black/20"
              >
                {/* Thumbnail */}
                <div className="aspect-[16/9] bg-gradient-to-br from-neutral-800 to-neutral-900 relative overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-neutral-700" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  {/* Category + date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[post.category] ?? "bg-neutral-500/15 text-neutral-400 border-neutral-500/25"}`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-neutral-600">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-neutral-600">
            {BRAND.appName} &mdash; {BRAND.trainerName} &bull;{" "}
            {BRAND.trainerTitle}
          </p>
        </div>
      </footer>
    </div>
  )
}
