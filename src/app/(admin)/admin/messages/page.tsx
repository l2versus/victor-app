"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Send, ArrowLeft, MessageCircle, Users, Search } from "lucide-react"

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

type StudentItem = {
  id: string
  userId: string
  user: { name: string; avatar: string | null }
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showStudentPicker, setShowStudentPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

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

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/students")
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || data)
      }
    } catch { /* ignore */ }
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

  useEffect(() => {
    fetchConversations()
    fetchStudents()
  }, [fetchConversations, fetchStudents])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id)
      pollRef.current = setInterval(() => fetchMessages(activeChat.id), 10000)
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

  function startNewChat(student: StudentItem) {
    setActiveChat({ id: student.userId, name: student.user.name })
    setShowStudentPicker(false)
  }

  // Filter students not already in conversations
  const existingPartnerIds = new Set(conversations.map(c => c.partnerId))
  const newStudents = students.filter(s =>
    !existingPartnerIds.has(s.userId) &&
    s.user.name.toLowerCase().includes(search.toLowerCase())
  )

  // Chat view
  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100dvh-8rem)]">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
          <button
            onClick={() => { setActiveChat(null); fetchConversations() }}
            className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[10px] font-semibold">
            {getInitials(activeChat.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{activeChat.name}</p>
            <p className="text-[10px] text-neutral-500">Aluno</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">Envie a primeira mensagem</p>
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

        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Mensagem para o aluno..."
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Mensagens</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Chat direto com seus alunos</p>
        </div>
        <button
          onClick={() => setShowStudentPicker(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-red-600/20"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Nova Mensagem
        </button>
      </div>

      {/* Student picker modal */}
      {showStudentPicker && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
              autoFocus
            />
            <button onClick={() => setShowStudentPicker(false)} className="text-xs text-neutral-500 hover:text-neutral-300">
              Fechar
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {students.filter(s => s.user.name.toLowerCase().includes(search.toLowerCase())).map((student) => (
              <button
                key={student.id}
                onClick={() => startNewChat(student)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors min-h-[44px] text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[9px] font-semibold">
                  {getInitials(student.user.name)}
                </div>
                <span className="text-sm text-neutral-300">{student.user.name}</span>
              </button>
            ))}
            {newStudents.length === 0 && (
              <p className="text-xs text-neutral-600 text-center py-4">Nenhum aluno encontrado</p>
            )}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 && !showStudentPicker ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Nenhuma conversa ainda</p>
          <p className="text-neutral-600 text-xs mt-1">Clique em &ldquo;Nova Mensagem&rdquo; para iniciar</p>
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
