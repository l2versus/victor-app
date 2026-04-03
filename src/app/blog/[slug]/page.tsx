import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { BRAND } from "@/lib/branding"
import { ArrowLeft, Calendar, Tag, BookOpen, User } from "lucide-react"
import { prisma } from "@/lib/prisma"
import sanitizeHtml from "sanitize-html"

type Props = {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      category: true,
      publishedAt: true,
      trainer: {
        select: { user: { select: { name: true } } },
      },
    },
  })
}

// ── SEO metadata ───────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: "Artigo não encontrado" }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: `${BRAND.appUrl}/blog/${post.slug}`,
      siteName: BRAND.appName,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.trainer?.user?.name ?? BRAND.trainerName],
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", {
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
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const authorName = post.trainer?.user?.name ?? BRAND.trainerName

  const sanitizedContent = sanitizeHtml(post.content, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br",
      "strong", "b", "em", "i", "u",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["https", "http"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  })

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
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[post.category ?? ""] ?? "bg-neutral-500/15 text-neutral-400 border-neutral-500/25"}`}
          >
            <Tag className="w-3 h-3" />
            {post.category ?? "Geral"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Calendar className="w-3 h-3" />
            {post.publishedAt ? formatDate(post.publishedAt) : "—"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <User className="w-3 h-3" />
            {authorName}
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

        {/* Content */}
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
