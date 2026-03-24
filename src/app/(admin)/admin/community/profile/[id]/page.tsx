"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, UserPlus, UserCheck, Dumbbell, Flame,
  Heart, MessageCircle, Grid3X3, Trophy, Calendar,
  Loader2, Target, Briefcase, Link2, ExternalLink,
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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/profile/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setPosts(data.posts)
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
  const postsTextOnly = posts.filter(p => !p.imageUrl)

  return (
    <div className="max-w-2xl mx-auto space-y-0">
      {/* Header bar */}
      <div className="flex items-center gap-3 py-3">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-white truncate flex-1">{profile.name}</h1>
      </div>

      {/* Profile header — Instagram style */}
      <div className="pb-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border-2 border-red-500/30 flex items-center justify-center text-red-300 text-xl font-bold shrink-0 overflow-hidden">
            {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" /> : getInitials(profile.name)}
          </div>
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center"><p className="text-lg font-bold text-white">{profile.stats.posts}</p><p className="text-[10px] text-neutral-500">Posts</p></div>
            <div className="text-center"><p className="text-lg font-bold text-white">{profile.stats.followers}</p><p className="text-[10px] text-neutral-500">Seguidores</p></div>
            <div className="text-center"><p className="text-lg font-bold text-white">{profile.stats.following}</p><p className="text-[10px] text-neutral-500">Seguindo</p></div>
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

      {/* Tabs */}
      <div className="flex border-t border-white/[0.06]">
        <div className="flex-1 flex items-center justify-center py-2.5 border-b-2 border-white text-white"><Grid3X3 className="w-4 h-4" /></div>
        <div className="flex-1 flex items-center justify-center py-2.5 text-neutral-600"><Trophy className="w-4 h-4" /></div>
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16"><Grid3X3 className="w-10 h-10 text-neutral-700 mx-auto mb-2" /><p className="text-neutral-500 text-sm">Nenhum post ainda</p></div>
      ) : (
        <>
          {postsWithImage.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5">
              {postsWithImage.map((post) => (
                <div key={post.id} className="relative aspect-square bg-neutral-900 overflow-hidden">
                  <img src={post.imageUrl!} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1 text-white text-xs font-semibold"><Heart className="w-4 h-4 fill-white" />{post.likesCount}</span>
                    <span className="flex items-center gap-1 text-white text-xs font-semibold"><MessageCircle className="w-4 h-4 fill-white" />{post.commentsCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {postsTextOnly.length > 0 && (
            <div className="px-4 pt-4 space-y-3">
              {postsTextOnly.map((post) => (
                <div key={post.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-sm text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2.5 text-xs text-neutral-600">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                      <Heart className={`w-3.5 h-3.5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />{post.likesCount}
                    </button>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.commentsCount}</span>
                    <span className="ml-auto">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
