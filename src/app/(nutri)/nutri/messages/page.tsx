"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  ArrowLeft,
  MessageCircle,
  Users,
  Search,
  X,
  CheckCheck,
  Check,
} from "lucide-react"

/* ════════════════════════════════════════════
   Types
   ════════════════════════════════════════════ */

type Message = {
  id: string
  content: string
  senderId: string
  senderName: string
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

type PatientItem = {
  id: string
  userId: string
  name: string
  avatar: string | null
}

/* ════════════════════════════════════════════
   Component
   ════════════════════════════════════════════ */

export default function NutriMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [patients, setPatients] = useState<PatientItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChat, setActiveChat] = useState<{
    id: string
    name: string
    avatar: string | null
  } | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchConv, setSearchConv] = useState("")
  const [searchPicker, setSearchPicker] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showPatientPicker, setShowPatientPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollConvRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const pollMsgRef = useRef<ReturnType<typeof setInterval>>(undefined)

  /* ── Data fetching ── */

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations ?? [])
      }
    } catch {
      /* network error — silent */
    }
    setLoading(false)
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/nutri/students")
      if (res.ok) {
        const data = await res.json()
        const list = (data.students ?? data) as Array<{
          id: string
          userId: string
          name: string
          avatar: string | null
        }>
        setPatients(
          list.map((s) => ({
            id: s.id,
            userId: s.userId,
            name: s.name,
            avatar: s.avatar,
          }))
        )
      }
    } catch {
      /* silent */
    }
  }, [])

  const fetchMessages = useCallback(async (partnerId: string) => {
    try {
      const res = await fetch(`/api/messages?with=${partnerId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
        setTimeout(
          () =>
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          120
        )
      }
    } catch {
      /* silent */
    }
  }, [])

  /* ── Lifecycle ── */

  useEffect(() => {
    fetchConversations()
    fetchPatients()

    // Poll conversations every 30s
    pollConvRef.current = setInterval(fetchConversations, 30_000)
    return () => clearInterval(pollConvRef.current)
  }, [fetchConversations, fetchPatients])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id)
      // Poll active chat messages every 10s
      pollMsgRef.current = setInterval(
        () => fetchMessages(activeChat.id),
        10_000
      )
      return () => clearInterval(pollMsgRef.current)
    } else {
      setMessages([])
    }
  }, [activeChat, fetchMessages])

  /* ── Actions ── */

  async function sendMessage() {
    if (!newMessage.trim() || !activeChat || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeChat.id,
          content: newMessage.trim(),
        }),
      })
      if (res.ok) {
        setNewMessage("")
        fetchMessages(activeChat.id)
        fetchConversations()
      }
    } catch {
      /* silent */
    }
    setSending(false)
  }

  function openChat(partnerId: string, name: string, avatar: string | null) {
    setActiveChat({ id: partnerId, name, avatar })
    setShowPatientPicker(false)
  }

  function closeChat() {
    setActiveChat(null)
    fetchConversations()
  }

  function startNewChat(patient: PatientItem) {
    openChat(patient.userId, patient.name, patient.avatar)
  }

  /* ── Helpers ── */

  function formatTime(date: string) {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()

    if (isToday)
      return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    if (isYesterday) return "Ontem"
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  /* ── Derived data ── */

  const existingPartnerIds = new Set(conversations.map((c) => c.partnerId))

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchConv.toLowerCase())
  )

  const filteredPickerPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchPicker.toLowerCase())
  )

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  /* ════════════════════════════════════════════
     Desktop layout: side-by-side
     Mobile: list OR chat
     ════════════════════════════════════════════ */

  return (
    <div className="h-[calc(100dvh-7rem)] flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-4">
        {/* Back button on mobile when chat is open */}
        <div className="flex items-center gap-3">
          {activeChat && (
            <button
              onClick={closeChat}
              className="md:hidden w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Mensagens
            </h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {totalUnread > 0
                ? `${totalUnread} mensage${totalUnread === 1 ? "m" : "ns"} não lida${totalUnread === 1 ? "" : "s"}`
                : "Chat com seus pacientes"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowPatientPicker(true)
            setSearchPicker("")
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nova Conversa</span>
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex gap-0 md:gap-4 min-h-0 overflow-hidden">
        {/* ════ LEFT: conversation list ════ */}
        <div
          className={`w-full md:w-[340px] lg:w-[380px] flex-shrink-0 flex flex-col min-h-0 ${
            activeChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              type="text"
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 transition-colors min-h-[44px]"
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">
                  {searchConv
                    ? "Nenhuma conversa encontrada"
                    : "Nenhuma conversa ainda"}
                </p>
                {!searchConv && (
                  <p className="text-neutral-600 text-xs mt-1">
                    Clique em &ldquo;Nova Conversa&rdquo; para iniciar
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeChat?.id === conv.partnerId
                return (
                  <motion.button
                    key={conv.partnerId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() =>
                      openChat(
                        conv.partnerId,
                        conv.partnerName,
                        conv.partnerAvatar
                      )
                    }
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all min-h-[64px] text-left ${
                      isActive
                        ? "bg-emerald-600/10 border-emerald-500/20"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {conv.partnerAvatar ? (
                        <img
                          src={conv.partnerAvatar}
                          alt={conv.partnerName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-emerald-300 text-[10px] font-semibold">
                          {getInitials(conv.partnerName)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {conv.partnerName}
                        </p>
                        <span className="text-[10px] text-neutral-600 shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </motion.button>
                )
              })
            )}
          </div>
        </div>

        {/* ════ RIGHT: chat panel ════ */}
        <div
          className={`flex-1 flex flex-col min-h-0 rounded-2xl bg-white/[0.01] border border-white/[0.06] overflow-hidden ${
            activeChat ? "flex" : "hidden md:flex"
          }`}
        >
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <button
                  onClick={closeChat}
                  className="hidden md:flex w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {activeChat.avatar ? (
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-300 text-[10px] font-semibold">
                      {getInitials(activeChat.name)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {activeChat.name}
                  </p>
                  <p className="text-[10px] text-neutral-500">Paciente</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-emerald-900/10 border border-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-7 h-7 text-emerald-500/50" />
                    </div>
                    <p className="text-neutral-400 text-sm font-medium">
                      Nenhuma mensagem ainda
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">
                      Envie a primeira mensagem para {activeChat.name}
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  // Group separator for date
                  const prev = idx > 0 ? messages[idx - 1] : null
                  const msgDate = new Date(msg.createdAt).toDateString()
                  const prevDate = prev
                    ? new Date(prev.createdAt).toDateString()
                    : null
                  const showDateSep = msgDate !== prevDate

                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-white/[0.06]" />
                          <span className="text-[10px] text-neutral-600 font-medium">
                            {(() => {
                              const d = new Date(msg.createdAt)
                              const now = new Date()
                              if (d.toDateString() === now.toDateString())
                                return "Hoje"
                              const y = new Date(now)
                              y.setDate(now.getDate() - 1)
                              if (d.toDateString() === y.toDateString())
                                return "Ontem"
                              return d.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                              })
                            })()}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl ${
                            msg.isMe
                              ? "bg-emerald-600/20 border border-emerald-500/20 rounded-br-md"
                              : "bg-white/[0.04] border border-white/[0.06] rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm text-neutral-200 leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              msg.isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span
                              className={`text-[9px] ${
                                msg.isMe
                                  ? "text-emerald-400/60"
                                  : "text-neutral-600"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.isMe && (
                              <span className="ml-0.5">
                                {msg.readAt ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-400/80" />
                                ) : (
                                  <Check className="w-3 h-3 text-neutral-600" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Escreva uma mensagem..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 transition-colors min-h-[44px]"
                    autoComplete="off"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 flex items-center justify-center text-white disabled:opacity-40 transition-all shadow-lg shadow-emerald-600/20 shrink-0 hover:shadow-emerald-600/30"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no chat selected (desktop) */
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-emerald-900/10 border border-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                  <MessageCircle className="w-9 h-9 text-emerald-500/40" />
                </div>
                <p className="text-neutral-400 text-sm font-medium">
                  Selecione uma conversa
                </p>
                <p className="text-neutral-600 text-xs mt-1">
                  Ou inicie uma nova conversa com um paciente
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* ════ Patient picker modal ════ */}
      <AnimatePresence>
        {showPatientPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowPatientPicker(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden overscroll-contain max-h-[85dvh] flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Nova Conversa
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Selecione um paciente para conversar
                  </p>
                </div>
                <button
                  onClick={() => setShowPatientPicker(false)}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 py-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    value={searchPicker}
                    onChange={(e) => setSearchPicker(e.target.value)}
                    placeholder="Buscar paciente..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 transition-colors min-h-[44px]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Patient list */}
              <div className="flex-1 overflow-y-auto px-3 pb-4 overscroll-contain">
                {filteredPickerPatients.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                    <p className="text-neutral-500 text-sm">
                      {searchPicker
                        ? "Nenhum paciente encontrado"
                        : "Nenhum paciente vinculado"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredPickerPatients.map((patient) => {
                      const hasConversation = existingPartnerIds.has(
                        patient.userId
                      )
                      return (
                        <button
                          key={patient.id}
                          onClick={() => startNewChat(patient)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors min-h-[52px] text-left group"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {patient.avatar ? (
                              <img
                                src={patient.avatar}
                                alt={patient.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-emerald-300 text-[9px] font-semibold">
                                {getInitials(patient.name)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-300 group-hover:text-white truncate transition-colors">
                              {patient.name}
                            </p>
                            {hasConversation && (
                              <p className="text-[10px] text-emerald-500/60 mt-0.5">
                                Conversa existente
                              </p>
                            )}
                          </div>
                          <MessageCircle className="w-4 h-4 text-neutral-700 group-hover:text-emerald-500 transition-colors shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
