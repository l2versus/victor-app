"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart, MessageCircle, Send, Camera, Play,
  Image as ImageIcon, X, Plus, Loader2, Search,
  Users, Trophy, Flame,
} from "lucide-react"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type FeedPost = {
  id: string
  type: string
  content: string
  imageUrl: string | null
  studentId: string | null
  studentName: string
  studentAvatar: string | null
  likesCount: number
  commentsCount: number
  isLiked: boolean
  createdAt: string
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ═══════════════════════════════════════
// MAIN PAGE — Admin Community View
// ═══════════════════════════════════════

export default function AdminCommunityPage() {
  const router = useRouter()
  const [feed, setFeed] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [postText, setPostText] = useState("")
  const [postImage, setPostImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/community/feed")
      if (res.ok) {
        const data = await res.json()
        setFeed(data.feed || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  async function toggleLike(postId: string) {
    setFeed(prev => prev.map(p =>
      p.id === postId ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 } : p
    ))
    await fetch(`/api/community/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    })
  }

  function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setPostImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function submitPost() {
    if ((!postText.trim() && !postImage) || posting) return
    setPosting(true)
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: postText, imageUrl: postImage }),
    })
    if (res.ok) {
      setPostText("")
      setPostImage(null)
      setShowComposer(false)
      fetchFeed()
    }
    setPosting(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comunidade</h1>
          <p className="text-sm text-neutral-500">Poste como personal trainer • Interaja com alunos</p>
        </div>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Post
        </button>
      </div>

      {/* Post Composer */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Victor Oliveira</p>
                  <p className="text-[10px] text-amber-400 font-medium">PERSONAL TRAINER</p>
                </div>
              </div>

              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value.slice(0, 2000))}
                placeholder="Compartilhe um treino, dica, motivação..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-red-500/50 min-h-[100px]"
              />

              {postImage && (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={postImage} alt="" className="w-full max-h-[200px] object-cover" />
                  <button onClick={() => setPostImage(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMedia} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs hover:text-white">
                    <ImageIcon className="w-4 h-4" /> Foto
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs hover:text-white">
                    <Play className="w-4 h-4" /> Vídeo
                  </button>
                </div>
                <button
                  onClick={submitPost}
                  disabled={(!postText.trim() && !postImage) || posting}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-30 flex items-center gap-2"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Nenhum post na comunidade</p>
          <p className="text-neutral-600 text-xs mt-1">Seja o primeiro a postar! Os alunos vão adorar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((post) => (
            <div key={post.id} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-xs font-bold overflow-hidden shrink-0">
                  {post.studentAvatar ? (
                    <img src={post.studentAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(post.studentName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{post.studentName}</p>
                    {!post.studentId && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-[8px] text-amber-400 font-bold uppercase tracking-wider">Personal</span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500">{timeAgo(post.createdAt)}</p>
                </div>
              </div>

              {/* Image */}
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" className="w-full max-h-[400px] object-cover" />
              )}

              {/* Actions */}
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id)} className="transition-transform active:scale-125">
                    <Heart className={`w-6 h-6 ${post.isLiked ? "fill-red-500 text-red-500" : "text-neutral-400 hover:text-white"}`} />
                  </button>
                  <MessageCircle className="w-5.5 h-5.5 text-neutral-400" />
                </div>
                {post.likesCount > 0 && (
                  <p className="text-xs font-semibold text-white mt-2">{post.likesCount} curtida{post.likesCount > 1 ? "s" : ""}</p>
                )}
                {post.content && (
                  <p className="text-sm text-neutral-300 mt-1.5 break-words whitespace-pre-wrap">
                    <span className="font-semibold text-white mr-1.5">{post.studentName.split(" ")[0]}</span>
                    {post.content}
                  </p>
                )}
                {post.commentsCount > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">{post.commentsCount} comentário{post.commentsCount > 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
