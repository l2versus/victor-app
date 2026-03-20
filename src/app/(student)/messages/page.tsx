"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ArrowLeft, MessageCircle, Crown, Lock } from "lucide-react"

type Message = {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  isMe: boolean
  readAt: string | null
  createdAt: string
}

type Conversation = {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  partnerRole: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isElite, setIsElite] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Check subscription
  useEffect(() => {
    fetch("/api/student/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          const planName = (data.planName || "").toLowerCase()
          setIsElite(planName.includes("elite") || data.hasVipGroup)
        }
      })
      .catch(() => {})
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async (partnerId: string) => {
    try {
      const res = await fetch(`/api/messages?with=${partnerId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Polling when in a chat
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id)
      pollRef.current = setInterval(() => fetchMessages(activeChat.id), 15000)
      return () => clearInterval(pollRef.current)
    }
  }, [activeChat, fetchMessages])

  async function sendMessage() {
    if (!newMessage.trim() || !activeChat || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeChat.id, content: newMessage.trim() }),
      })
      if (res.ok) {
        setNewMessage("")
        fetchMessages(activeChat.id)
      }
    } catch { /* ignore */ }
    setSending(false)
  }

  function formatTime(date: string) {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Elite gate
  if (!isElite && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/20 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Chat Privado com Victor</h2>
        <p className="text-sm text-neutral-400 mb-6 max-w-xs">
          Converse diretamente com seu treinador. Disponível no plano Elite.
        </p>
        <a
          href="/upgrade"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold min-h-[44px] shadow-lg shadow-red-600/20"
        >
          <Crown className="w-4 h-4" />
          Fazer Upgrade
        </a>
      </div>
    )
  }

  // Chat view
  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100dvh-8rem)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
          <button
            onClick={() => { setActiveChat(null); fetchConversations() }}
            className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[10px] font-semibold shrink-0">
            {getInitials(activeChat.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{activeChat.name}</p>
            <p className="text-[10px] text-neutral-500">Treinador</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">Inicie uma conversa com seu treinador</p>
            </div>
          )}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
                msg.isMe
                  ? "bg-red-600/20 border border-red-500/20 rounded-br-md"
                  : "bg-white/[0.04] border border-white/[0.06] rounded-bl-md"
              }`}>
                <p className="text-sm text-neutral-200 leading-relaxed break-words">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${msg.isMe ? "text-red-400/60" : "text-neutral-600"}`}>
                  {formatTime(msg.createdAt)}
                  {msg.isMe && msg.readAt && " · lido"}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white disabled:opacity-40 transition-all shadow-lg shadow-red-600/20 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Conversations list
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/20">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Mensagens</h1>
            <p className="text-xs text-neutral-500">Chat direto com Victor</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Nenhuma conversa ainda</p>
          <p className="text-neutral-600 text-xs mt-1">Victor pode iniciar uma conversa com você a qualquer momento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <motion.button
              key={conv.partnerId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setActiveChat({ id: conv.partnerId, name: conv.partnerName })}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all min-h-[64px] text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[10px] font-semibold shrink-0">
                {conv.partnerAvatar ? (
                  <img src={conv.partnerAvatar} alt={conv.partnerName} className="w-full h-full rounded-full object-cover" />
                ) : getInitials(conv.partnerName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white truncate">{conv.partnerName}</p>
                  <span className="text-[10px] text-neutral-600 shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">{conv.unreadCount}</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
