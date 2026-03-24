"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Search } from "lucide-react"

type Conversation = {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
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

export default function DMInboxPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/community/dm")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchInbox() }, [fetchInbox])

  const filtered = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-0 -mx-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-white flex-1">Mensagens</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-neutral-500 text-sm">
            {conversations.length === 0 ? "Nenhuma conversa ainda" : "Nenhum resultado"}
          </p>
          <p className="text-neutral-700 text-xs mt-1">
            Visite o perfil de alguém e toque no botão de mensagem
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((c) => (
            <button
              key={c.partnerId}
              onClick={() => router.push(`/community/dm/${c.partnerId}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-sm font-bold shrink-0 overflow-hidden">
                {c.partnerAvatar ? (
                  <img src={c.partnerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(c.partnerName)
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${c.unreadCount > 0 ? "font-bold text-white" : "font-medium text-neutral-300"}`}>
                    {c.partnerName}
                  </p>
                  <span className="text-[10px] text-neutral-600 shrink-0 ml-2">
                    {timeAgo(c.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? "text-neutral-300" : "text-neutral-600"}`}>
                    {c.lastMessage}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
