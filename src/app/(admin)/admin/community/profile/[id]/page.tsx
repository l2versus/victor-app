"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, UserPlus, UserCheck, Dumbbell, Flame, X,
  Heart, MessageCircle, Grid3X3, Trophy, Calendar,
  Loader2, Target, Briefcase, Link2, ExternalLink,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { SafeImage, SafeAvatar } from "@/components/ui/safe-image"

type ProfileData = {
  studentId: string
  userId: string
  name: string
  avatar: string | null
  memberSince: string
  goals: string | null
  bio: string | null
  profession: string | null
  bioLink: string | null
  isMe: boolean
  isFollowing: boolean
  stats: { followers: number; following: number; posts: number; sessions: number; streak: number }
}

type PostItem = {
  id: string
  type: string
  content: string
  imageUrl: string | null
  likesCount: number
  commentsCount: number
  isLiked: boolean
  createdAt: string
}

type Highlight = {
  id: string; title: string; coverUrl: string; itemCount: number
  items: Array<{ id: string; imageUrl: string; caption: string | null; createdAt: string }>
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return "Hoje"
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}sem`
  return `${Math.floor(days / 30)}m`
}

export default function AdminCommunityProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [showFollowList, setShowFollowList] = useState<"followers" | "following" | null>(null)
  const [followList, setFollowList] = useState<Array<{ studentId: string; name: string; avatar: string | null; isMe: boolean; iFollow: boolean; followsMe: boolean }>>([])
  const [loadingFollows, setLoadingFollows] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)

  // Story Highlights
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [viewingHighlight, setViewingHighlight] = useState<{ highlight: Highlight; index: number } | null>(null)

  async function openFollowList(type: "followers" | "following") {
    setShowFollowList(type)
    setLoadingFollows(true)
    try {
      const res = await fetch(`/api/community/follow?type=${type}&studentId=${id}`)
      if (res.ok) { const data = await res.json(); setFollowList(data.users || []) }
    } catch { /* ignore */ }
    setLoadingFollows(false)
  }

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, highlightsRes] = await Promise.all([
        fetch(`/api/community/profile/${id}`),
        fetch(`/api/community/stories/highlights?studentId=${id}`),
      ])
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile)
        setPosts(data.posts)
      }
      if (highlightsRes.ok) {
        const highlightsData = await highlightsRes.json()
        setHighlights(highlightsData.highlights || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function toggleFollow() {
    if (!profile || profile.isMe || followLoading) return
    setFollowLoading(true)
    setProfile(prev => prev ? {
      ...prev,
      isFollowing: !prev.isFollowing,
      stats: { ...prev.stats, followers: prev.isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1 },
    } : null)
    await fetch("/api/community/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id }),
    })
    setFollowLoading(false)
  }

  async function toggleLike(postId: string) {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 } : p
    ))
    await fetch(`/api/community/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    })
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
  if (!profile) return <div className="text-center py-20"><p className="text-neutral-500">Perfil não encontrado</p></div>

  const postsWithImage = posts.filter(p => p.imageUrl)

  return (
    <div className="max-w-2xl mx-auto space-y-0">
      {/* Header bar */}
      <div className="flex items-center gap-3 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 min-h-11 min-w-11 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-white truncate flex-1">{profile.name}</h1>
      </div>

      {/* Profile header — Instagram style */}
      <div className="pb-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border-2 border-red-500/30 flex items-center justify-center text-red-300 text-xl font-bold shrink-0 overflow-hidden">
            <SafeAvatar src={profile.avatar} name={profile.name} size="lg" className="w-full h-full text-xl" />
          </div>
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center"><p className="text-lg font-bold text-white">{profile.stats.posts}</p><p className="text-[10px] text-neutral-500">Posts</p></div>
            <button onClick={() => openFollowList("followers")} className="text-center cursor-pointer hover:opacity-70 transition-opacity">
              <p className="text-lg font-bold text-white">{profile.stats.followers}</p><p className="text-[10px] text-neutral-500">Seguidores</p>
            </button>
            <button onClick={() => openFollowList("following")} className="text-center cursor-pointer hover:opacity-70 transition-opacity">
              <p className="text-lg font-bold text-white">{profile.stats.following}</p><p className="text-[10px] text-neutral-500">Seguindo</p>
            </button>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold text-white">{profile.name}</p>
          {profile.profession && <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Briefcase className="w-3 h-3" />{profile.profession}</p>}
          {profile.bio && <p className="text-xs text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>}
          {profile.bioLink && (
            <a href={profile.bioLink.startsWith("http") ? profile.bioLink : `https://${profile.bioLink}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 mt-1 flex items-center gap-1 hover:underline">
              <Link2 className="w-3 h-3" />{profile.bioLink.replace(/^https?:\/\//, "").slice(0, 40)}<ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {!profile.bio && !profile.profession && profile.goals && <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Target className="w-3 h-3" />{profile.goals}</p>}
          <p className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Membro desde {new Date(profile.memberSince).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</p>
        </div>

        <div className="flex gap-2 mt-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-400"><Dumbbell className="w-3 h-3 text-red-400" />{profile.stats.sessions} sessões</span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-400"><Flame className="w-3 h-3 text-orange-400" />{profile.stats.streak} sem streak</span>
        </div>

        {!profile.isMe && (
          <motion.button onClick={toggleFollow} whileTap={{ scale: 0.97 }} className={`w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-11 ${profile.isFollowing ? "bg-white/[0.06] border border-white/[0.1] text-neutral-300" : "bg-red-600 text-white shadow-lg shadow-red-600/20"}`}>
            {profile.isFollowing ? <span className="flex items-center justify-center gap-2"><UserCheck className="w-4 h-4" />Seguindo</span> : <span className="flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" />Seguir</span>}
          </motion.button>
        )}
      </div>

      {/* Story Highlights */}
      {highlights.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {highlights.map((h) => (
              <button
                key={h.id}
                onClick={() => h.items.length > 0 && setViewingHighlight({ highlight: h, index: 0 })}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-16 h-16 rounded-full p-[2px] border-2 border-neutral-600">
                  <div className="w-full h-full rounded-full overflow-hidden bg-neutral-800">
                    <SafeImage src={h.coverUrl} alt={h.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 w-16 text-center truncate">{h.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-t border-white/[0.06]">
        <div className="flex-1 flex items-center justify-center py-2.5 border-b-2 border-white text-white"><Grid3X3 className="w-4 h-4" /></div>
        <div className="flex-1 flex items-center justify-center py-2.5 text-neutral-600"><Trophy className="w-4 h-4" /></div>
      </div>

      {/* Grid — only photo posts (Instagram flow) */}
      {postsWithImage.length === 0 ? (
        <div className="text-center py-16"><Grid3X3 className="w-10 h-10 text-neutral-700 mx-auto mb-2" /><p className="text-neutral-500 text-sm">Nenhuma foto publicada</p></div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {postsWithImage.map((post) => (
            <button key={post.id} onClick={() => setSelectedPost(post)} className="relative aspect-square bg-neutral-900 overflow-hidden group">
              <SafeImage src={post.imageUrl!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <span className="flex items-center gap-1 text-white text-xs font-semibold"><Heart className="w-4 h-4 fill-white" />{post.likesCount}</span>
                <span className="flex items-center gap-1 text-white text-xs font-semibold"><MessageCircle className="w-4 h-4 fill-white" />{post.commentsCount}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Highlight Viewer Modal */}
      {viewingHighlight && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setViewingHighlight(null)}>
          <div className="w-full max-w-lg h-full relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="absolute top-2 left-3 right-3 flex gap-1 z-10">
              {viewingHighlight.highlight.items.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${
                    i <= viewingHighlight.index ? "bg-white w-full" : "w-0"
                  }`} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 left-3 right-3 flex items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-600">
                <SafeImage src={viewingHighlight.highlight.coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-white text-sm font-semibold block">{viewingHighlight.highlight.title}</span>
                {profile && <span className="text-white/50 text-[10px]">{profile.name.split(" ")[0]}</span>}
              </div>
              <button onClick={() => setViewingHighlight(null)} className="ml-auto text-white/70 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media */}
            <div className="flex-1 relative">
              <SafeImage
                src={viewingHighlight.highlight.items[viewingHighlight.index].imageUrl}
                alt=""
                className="w-full h-full object-contain"
              />
              {viewingHighlight.highlight.items[viewingHighlight.index].caption && (
                <div className="absolute bottom-4 left-0 right-0 px-4">
                  <p className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                    {viewingHighlight.highlight.items[viewingHighlight.index].caption}
                  </p>
                </div>
              )}

              {/* Nav tap zones */}
              <button className="absolute left-0 top-0 w-1/3 h-full" onClick={() => {
                if (viewingHighlight.index > 0) setViewingHighlight({ ...viewingHighlight, index: viewingHighlight.index - 1 })
                else setViewingHighlight(null)
              }} />
              <button className="absolute right-0 top-0 w-2/3 h-full" onClick={() => {
                const next = viewingHighlight.index + 1
                if (next < viewingHighlight.highlight.items.length) setViewingHighlight({ ...viewingHighlight, index: next })
                else setViewingHighlight(null)
              }} />
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal") || document.body
      )}

      {/* Followers/Following Modal — portal to escape stacking context */}
      {showFollowList && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80" onClick={() => setShowFollowList(null)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="absolute inset-x-0 bottom-0 max-w-lg mx-auto bg-[#111] rounded-t-2xl flex flex-col"
            style={{ maxHeight: "85dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div />
              <h3 className="text-sm font-bold text-white">{showFollowList === "followers" ? "Seguidores" : "Seguindo"}</h3>
              <button onClick={() => setShowFollowList(null)} className="text-neutral-400 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
              {loadingFollows ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
              ) : followList.length === 0 ? (
                <p className="text-center text-neutral-500 text-sm py-10">{showFollowList === "followers" ? "Nenhum seguidor" : "Não segue ninguém"}</p>
              ) : (
                followList.map((u) => (
                  <div key={u.studentId} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
                    <button onClick={() => { setShowFollowList(null); router.push(`/admin/community/profile/${u.studentId}`) }} className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer">
                      <SafeAvatar src={u.avatar} name={u.name} size="md" className="w-11 h-11 text-xs shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                        {u.followsMe && !u.iFollow && <p className="text-[10px] text-neutral-500">Segue você</p>}
                      </div>
                    </button>
                    {!u.isMe && (
                      <button
                        onClick={async () => {
                          await fetch("/api/community/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: u.studentId }) })
                          openFollowList(showFollowList)
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold min-h-9 ${u.iFollow ? "bg-white/[0.06] border border-white/[0.1] text-neutral-300" : "bg-red-600 text-white"}`}
                      >
                        {u.iFollow ? "Seguindo" : u.followsMe ? "Seguir de volta" : "Seguir"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>,
        document.getElementById("modal-portal") || document.body
      )}

      {/* Post detail modal */}
      {selectedPost && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-xl bg-[#111] border border-neutral-800 overflow-hidden"
            style={{ maxHeight: "85dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedPost.imageUrl && (
              <SafeImage src={selectedPost.imageUrl} alt="" className="w-full max-h-[60dvh] object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => toggleLike(selectedPost.id)} className="active:scale-125 transition-transform">
                  <Heart className={`w-6 h-6 ${selectedPost.isLiked ? "fill-red-500 text-red-500" : "text-neutral-400"}`} />
                </button>
                <span className="text-sm text-white font-semibold">{selectedPost.likesCount} curtida{selectedPost.likesCount !== 1 ? "s" : ""}</span>
              </div>
              {selectedPost.content && (
                <p className="text-sm text-neutral-300 break-words whitespace-pre-wrap">
                  <span className="font-semibold text-white mr-1.5">{profile?.name?.split(" ")[0] || "User"}</span>
                  {selectedPost.content}
                </p>
              )}
              <p className="text-[10px] text-neutral-600 mt-2">{timeAgo(selectedPost.createdAt)}</p>
            </div>
          </motion.div>
        </div>,
        document.getElementById("modal-portal") || document.body
      )}
    </div>
  )
}
