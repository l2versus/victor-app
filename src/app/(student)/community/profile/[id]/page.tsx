"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, UserPlus, UserCheck, Dumbbell, Flame,
  Heart, MessageCircle, Grid3X3, Trophy, Calendar,
  Loader2, Target,
} from "lucide-react"

type ProfileData = {
  studentId: string
  name: string
  avatar: string | null
  memberSince: string
  goals: string | null
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
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border-2 border-red-500/30 flex items-center justify-center text-red-300 text-xl font-bold shrink-0 overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.name)
            )}
          </div>

          {/* Stats row */}
          <div className="flex-1 flex items-center justify-around">
            <StatColumn value={profile.stats.posts} label="Posts" />
            <StatColumn value={profile.stats.followers} label="Seguidores" />
            <StatColumn value={profile.stats.following} label="Seguindo" />
          </div>
        </div>

        {/* Name + bio */}
        <div className="mt-3">
          <p className="text-sm font-semibold text-white">{profile.name}</p>
          {profile.goals && (
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

        {/* Follow button */}
        {!profile.isMe && (
          <motion.button
            onClick={toggleFollow}
            whileTap={{ scale: 0.97 }}
            className={`w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
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
        )}
      </div>

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

      {/* Post detail modal */}
      {selectedPost && (
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
                  <span className="font-semibold text-white mr-1.5">{profile.name.split(" ")[0]}</span>
                  {selectedPost.content}
                </p>
              )}
              <p className="text-[10px] text-neutral-600 mt-2">{timeAgo(selectedPost.createdAt)}</p>
            </div>
          </motion.div>
        </div>
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
