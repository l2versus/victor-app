"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, UserPlus, UserCheck, Dumbbell, Flame,
  Heart, MessageCircle, Grid3X3, Trophy, Calendar,
  Loader2, Target, Send, Pencil, X, Check, Link2, Briefcase,
  ExternalLink, Plus, Camera, ChevronLeft, ChevronRight,
} from "lucide-react"

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
  stats: {
    followers: number
    following: number
    posts: number
    sessions: number
    streak: number
  }
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

export default function SocialProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState("")
  const [editProfession, setEditProfession] = useState("")
  const [editLink, setEditLink] = useState("")
  const [saving, setSaving] = useState(false)
  const [showFollowList, setShowFollowList] = useState<"followers" | "following" | null>(null)
  const [followList, setFollowList] = useState<Array<{ studentId: string; name: string; avatar: string | null; isMe: boolean; iFollow: boolean; followsMe: boolean }>>([])
  const [loadingFollows, setLoadingFollows] = useState(false)

  // Stories for this profile
  type ProfileStory = { id: string; imageUrl: string; caption: string | null; viewCount: number; createdAt: string; expiresAt: string }
  const [profileStories, setProfileStories] = useState<ProfileStory[]>([])
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null)

  // Story Highlights
  type Highlight = {
    id: string; title: string; coverUrl: string; itemCount: number
    items: Array<{ id: string; imageUrl: string; caption: string | null; createdAt: string }>
  }
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [viewingHighlight, setViewingHighlight] = useState<{ highlight: Highlight; index: number } | null>(null)
  const [showCreateHighlight, setShowCreateHighlight] = useState(false)
  const [newHighlightTitle, setNewHighlightTitle] = useState("")
  const [newHighlightFile, setNewHighlightFile] = useState<File | null>(null)
  const [newHighlightPreview, setNewHighlightPreview] = useState<string | null>(null)
  const [creatingHighlight, setCreatingHighlight] = useState(false)

  async function openFollowList(type: "followers" | "following") {
    setShowFollowList(type)
    setLoadingFollows(true)
    try {
      const res = await fetch(`/api/community/follow?type=${type}&studentId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setFollowList(data.users || [])
      }
    } catch { /* ignore */ }
    setLoadingFollows(false)
  }

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, storiesRes, highlightsRes] = await Promise.all([
        fetch(`/api/community/profile/${id}`),
        fetch("/api/community/stories"),
        fetch(`/api/community/stories/highlights?studentId=${id}`),
      ])
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile)
        setPosts(data.posts)
      }
      if (storiesRes.ok) {
        const storiesData = await storiesRes.json()
        const groups = storiesData.storyGroups || []
        const myGroup = groups.find((g: { studentId: string }) => g.studentId === id)
        if (myGroup) {
          setProfileStories(myGroup.stories)
        }
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

    // Optimistic
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

  function startEditing() {
    if (!profile) return
    setEditBio(profile.bio || "")
    setEditProfession(profile.profession || "")
    setEditLink(profile.bioLink || "")
    setEditing(true)
  }

  async function saveProfile() {
    if (!profile || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/community/profile/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: editBio, profession: editProfession, bioLink: editLink }),
      })
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, bio: editBio || null, profession: editProfession || null, bioLink: editLink || null } : null)
        setEditing(false)
      }
    } catch { /* ignore */ }
    setSaving(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Perfil não encontrado</p>
      </div>
    )
  }

  const postsWithImage = posts.filter(p => p.imageUrl)
  const postsTextOnly = posts.filter(p => !p.imageUrl)

  return (
    <div className="space-y-0 -mx-4">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-white truncate flex-1">{profile.name}</h1>
      </div>

      {/* Profile header — Instagram style */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-5">
          {/* Avatar — story ring if has active stories */}
          <button
            onClick={() => profileStories.length > 0 && setViewingStoryIndex(0)}
            className={`w-20 h-20 rounded-full shrink-0 ${
              profileStories.length > 0
                ? "p-[2.5px] bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-400 cursor-pointer"
                : ""
            }`}
          >
            <div className={`w-full h-full rounded-full ${profileStories.length > 0 ? "bg-[#030303] p-[2px]" : ""}`}>
              <div className={`w-full h-full rounded-full ${profileStories.length > 0 ? "" : "bg-gradient-to-br from-red-600/30 to-red-900/30 border-2 border-red-500/30"} flex items-center justify-center text-red-300 text-xl font-bold overflow-hidden`}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile.name)
                )}
              </div>
            </div>
          </button>

          {/* Stats row — tappable like Instagram */}
          <div className="flex-1 flex items-center justify-around">
            <StatColumn value={profile.stats.posts} label="Posts" />
            <button onClick={() => openFollowList("followers")} className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95">
              <StatColumn value={profile.stats.followers} label="Seguidores" />
            </button>
            <button onClick={() => openFollowList("following")} className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95">
              <StatColumn value={profile.stats.following} label="Seguindo" />
            </button>
          </div>
        </div>

        {/* Name + bio + profession */}
        <div className="mt-3">
          <p className="text-sm font-semibold text-white">{profile.name}</p>
          {profile.profession && (
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-neutral-500" />
              {profile.profession}
            </p>
          )}
          {profile.bio && (
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          )}
          {profile.bioLink && (
            <a
              href={profile.bioLink.startsWith("http") ? profile.bioLink : `https://${profile.bioLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 mt-1 flex items-center gap-1 hover:underline"
            >
              <Link2 className="w-3 h-3" />
              {profile.bioLink.replace(/^https?:\/\//, "").slice(0, 40)}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {!profile.bio && !profile.profession && profile.goals && (
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
              <Target className="w-3 h-3" />
              {profile.goals}
            </p>
          )}
          <p className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Membro desde {new Date(profile.memberSince).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Training badges */}
        <div className="flex gap-2 mt-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-400">
            <Dumbbell className="w-3 h-3 text-red-400" />
            {profile.stats.sessions} sessões
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-400">
            <Flame className="w-3 h-3 text-orange-400" />
            {profile.stats.streak} sem streak
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {profile.isMe ? (
            <motion.button
              onClick={startEditing}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Pencil className="w-4 h-4" />
              Editar perfil
            </motion.button>
          ) : (
            <>
              <motion.button
                onClick={toggleFollow}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                  profile.isFollowing
                    ? "bg-white/[0.06] border border-white/[0.1] text-neutral-300"
                    : "bg-red-600 text-white shadow-lg shadow-red-600/20"
                }`}
              >
                {profile.isFollowing ? (
                  <span className="flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Seguindo
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Seguir
                  </span>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/community/dm/${profile.userId}`)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/[0.06] border border-white/[0.1] text-neutral-300 min-h-[44px]"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>

        {/* Edit profile modal */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3"
          >
            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                placeholder="Conte sobre você..."
                rows={2}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-red-500/50"
              />
              <p className="text-[10px] text-neutral-600 text-right">{editBio.length}/150</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">Profissão</label>
              <input
                value={editProfession}
                onChange={(e) => setEditProfession(e.target.value.slice(0, 60))}
                placeholder="Ex: Engenheiro, Designer, Estudante..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">Link</label>
              <input
                value={editLink}
                onChange={(e) => setEditLink(e.target.value.slice(0, 200))}
                placeholder="instagram.com/seuuser"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-sm flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button onClick={saveProfile} disabled={saving} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Story Highlights — permanent circles */}
      {(highlights.length > 0 || profile.isMe) && (
        <div className="px-4 pb-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {/* Add highlight button — only for own profile */}
            {profile.isMe && (
              <button
                onClick={() => setShowCreateHighlight(true)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-white/[0.04] border-2 border-dashed border-white/[0.15] flex items-center justify-center">
                  <Plus className="w-4 h-4 text-neutral-400" />
                </div>
                <span className="text-[10px] text-neutral-500 w-16 text-center truncate">Novo</span>
              </button>
            )}

            {/* Highlight circles */}
            {highlights.map((h) => (
              <button
                key={h.id}
                onClick={() => h.items.length > 0 && setViewingHighlight({ highlight: h, index: 0 })}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-16 h-16 rounded-full p-[2px] border-2 border-neutral-600">
                  <div className="w-full h-full rounded-full overflow-hidden bg-neutral-800">
                    <img src={h.coverUrl} alt={h.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 w-16 text-center truncate">{h.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Highlight Modal */}
      {showCreateHighlight && profile.isMe && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center" onClick={() => { setShowCreateHighlight(false); setNewHighlightFile(null); setNewHighlightPreview(null); setNewHighlightTitle("") }}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-lg bg-[#111] border-t border-white/[0.08] rounded-t-2xl p-5 pb-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Novo Destaque</h3>
              <button onClick={() => { setShowCreateHighlight(false); setNewHighlightFile(null); setNewHighlightPreview(null); setNewHighlightTitle("") }} className="text-neutral-500"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">Nome do destaque</label>
              <input
                value={newHighlightTitle}
                onChange={(e) => setNewHighlightTitle(e.target.value.slice(0, 30))}
                placeholder="Ex: Treino, Antes/Depois, Dicas..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-500/50"
              />
            </div>

            {!newHighlightPreview ? (
              <label className="flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 text-sm font-semibold cursor-pointer active:scale-95 transition-transform">
                <Camera className="w-5 h-5" />
                Escolher capa + primeira foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setNewHighlightFile(file)
                    setNewHighlightPreview(URL.createObjectURL(file))
                  }}
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                <img src={newHighlightPreview} alt="Preview" className="w-full max-h-[30dvh] object-cover" />
                <button
                  onClick={() => { setNewHighlightFile(null); setNewHighlightPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <button
              onClick={async () => {
                if (!newHighlightTitle.trim() || !newHighlightFile || creatingHighlight) return
                setCreatingHighlight(true)
                try {
                  const { upload } = await import("@vercel/blob/client")
                  const blob = await upload(
                    `highlights/${Date.now()}-${newHighlightFile.name}`,
                    newHighlightFile,
                    { access: "public", handleUploadUrl: "/api/upload" }
                  )
                  await fetch("/api/community/stories/highlights", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "create",
                      title: newHighlightTitle.trim(),
                      coverUrl: blob.url,
                      imageUrl: blob.url,
                    }),
                  })
                  setShowCreateHighlight(false)
                  setNewHighlightFile(null)
                  setNewHighlightPreview(null)
                  setNewHighlightTitle("")
                  fetchProfile()
                } catch { /* ignore */ }
                setCreatingHighlight(false)
              }}
              disabled={!newHighlightTitle.trim() || !newHighlightFile || creatingHighlight}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 active:scale-[0.98] transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              {creatingHighlight ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Destaque"}
            </button>
          </motion.div>
        </div>,
        document.getElementById("modal-portal") || document.body
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
                <img src={viewingHighlight.highlight.coverUrl} alt="" className="w-full h-full object-cover" />
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
              <img
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

      {/* Tab divider */}
      <div className="flex border-t border-white/[0.06]">
        <div className="flex-1 flex items-center justify-center py-2.5 border-b-2 border-white text-white">
          <Grid3X3 className="w-4 h-4" />
        </div>
        <div className="flex-1 flex items-center justify-center py-2.5 text-neutral-600">
          <Trophy className="w-4 h-4" />
        </div>
      </div>

      {/* Posts grid — Instagram 3-column */}
      {posts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Grid3X3 className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">Nenhum post ainda</p>
        </div>
      ) : (
        <>
          {/* Image grid */}
          {postsWithImage.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {postsWithImage.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square bg-neutral-900 overflow-hidden group"
                >
                  <img src={post.imageUrl!} alt="" className="w-full h-full object-cover" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1 text-white text-xs font-semibold">
                      <Heart className="w-4 h-4 fill-white" /> {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-white text-xs font-semibold">
                      <MessageCircle className="w-4 h-4 fill-white" /> {post.commentsCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Text-only posts below grid */}
          {postsTextOnly.length > 0 && (
            <div className="px-4 pt-4 space-y-3">
              {postsTextOnly.map((post) => (
                <div key={post.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-sm text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2.5 text-xs text-neutral-600">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                      <Heart className={`w-3.5 h-3.5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      {post.likesCount}
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> {post.commentsCount}
                    </span>
                    <span className="ml-auto">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Profile Story Viewer Modal */}
      {viewingStoryIndex !== null && profile && profileStories.length > 0 && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setViewingStoryIndex(null)}>
          <div className="w-full max-w-lg h-full relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="absolute top-2 left-3 right-3 flex gap-1 z-10">
              {profileStories.map((s, i) => (
                <div key={s.id} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${
                    i <= viewingStoryIndex ? "bg-white w-full" : "w-0"
                  }`} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 left-3 right-3 flex items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-neutral-300 text-xs font-bold">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile.name)
                )}
              </div>
              <span className="text-white text-sm font-semibold">{profile.name.split(" ")[0]}</span>
              <span className="text-white/50 text-xs">{timeAgo(profileStories[viewingStoryIndex].createdAt)}</span>
              {profile.isMe && profileStories[viewingStoryIndex].viewCount > 0 && (
                <span className="text-white/50 text-[10px]">👁 {profileStories[viewingStoryIndex].viewCount}</span>
              )}
              <button onClick={() => setViewingStoryIndex(null)} className="ml-auto text-white/70 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media */}
            <div className="flex-1 relative">
              {(() => {
                const url = profileStories[viewingStoryIndex].imageUrl
                const isVid = /\.(mp4|mov|webm|quicktime)/i.test(url)
                return isVid ? (
                  <video key={url} src={url} className="w-full h-full object-contain" autoPlay playsInline loop />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-contain" />
                )
              })()}

              {profileStories[viewingStoryIndex].caption && (
                <div className="absolute bottom-4 left-0 right-0 px-4">
                  <p className="text-white text-sm bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                    {profileStories[viewingStoryIndex].caption}
                  </p>
                </div>
              )}

              {/* Nav tap zones */}
              <button className="absolute left-0 top-0 w-1/3 h-full" onClick={() => {
                if (viewingStoryIndex > 0) setViewingStoryIndex(viewingStoryIndex - 1)
                else setViewingStoryIndex(null)
              }} />
              <button className="absolute right-0 top-0 w-2/3 h-full" onClick={() => {
                const next = viewingStoryIndex + 1
                if (next < profileStories.length) {
                  setViewingStoryIndex(next)
                  fetch("/api/community/stories/view", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId: profileStories[next].id }),
                  })
                } else setViewingStoryIndex(null)
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
            style={{ maxHeight: "80dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div />
              <h3 className="text-sm font-bold text-white">
                {showFollowList === "followers" ? "Seguidores" : "Seguindo"}
              </h3>
              <button onClick={() => setShowFollowList(null)} className="text-neutral-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
              {loadingFollows ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                </div>
              ) : followList.length === 0 ? (
                <p className="text-center text-neutral-500 text-sm py-10">
                  {showFollowList === "followers" ? "Nenhum seguidor ainda" : "Não segue ninguém ainda"}
                </p>
              ) : (
                followList.map((u) => (
                  <div key={u.studentId} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
                    <button
                      onClick={() => { setShowFollowList(null); router.push(`/community/profile/${u.studentId}`) }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-xs font-bold shrink-0 overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                        {u.followsMe && !u.iFollow && (
                          <p className="text-[10px] text-neutral-500">Segue você</p>
                        )}
                      </div>
                    </button>
                    {!u.isMe && (
                      <button
                        onClick={async () => {
                          await fetch("/api/community/follow", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ studentId: u.studentId }),
                          })
                          openFollowList(showFollowList)
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold min-h-9 transition-all ${
                          u.iFollow
                            ? "bg-white/[0.06] border border-white/[0.1] text-neutral-300"
                            : u.followsMe
                              ? "bg-red-600 text-white"
                              : "bg-red-600 text-white"
                        }`}
                      >
                        {u.iFollow
                          ? "Seguindo"
                          : u.followsMe
                            ? "Seguir de volta"
                            : "Seguir"}
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

      {/* Post detail modal — portal to escape stacking context */}
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
              <img src={selectedPost.imageUrl} alt="" className="w-full max-h-[60dvh] object-cover" />
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

function StatColumn({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-neutral-500">{label}</p>
    </div>
  )
}
