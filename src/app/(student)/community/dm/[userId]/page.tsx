"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send, Loader2, Check, CheckCheck } from "lucide-react"

type Message = {
  id: string
  content: string
  isMe: boolean
  senderName: string
  senderAvatar: string | null
  readAt: string | null
  createdAt: string
}

type Partner = {
  id: string
  name: string
  avatar: string | null
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function DMThreadPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/dm/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
        setMessages(data.messages)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchThread() }, [fetchThread])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Poll for new messages every 5s
  useEffect(() => {
    const interval = setInterval(fetchThread, 5000)
    return () => clearInterval(interval)
  }, [fetchThread])

  async function sendMessage() {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText("")

    // Optimistic
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      isMe: true,
      senderName: "Eu",
      senderAvatar: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await fetch("/api/community/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, content }),
      })
      fetchThread()
    } catch { /* ignore */ }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] -mx-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-xs font-bold shrink-0 overflow-hidden">
          {partner?.avatar ? (
            <img src={partner.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(partner?.name || "?")
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{partner?.name || "Usuário"}</p>
          <p className="text-[10px] text-neutral-500">Victor Personal Family</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 overscroll-contain">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-neutral-600 text-sm">Nenhuma mensagem ainda</p>
            <p className="text-neutral-700 text-xs mt-1">Envie a primeira mensagem!</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.isMe
                ? "bg-red-600 text-white rounded-br-md"
                : "bg-white/[0.06] text-neutral-200 rounded-bl-md"
            }`}>
              <p className="break-words whitespace-pre-wrap">{m.content}</p>
              <div className={`flex items-center gap-1 mt-1 ${m.isMe ? "justify-end" : ""}`}>
                <span className="text-[9px] opacity-60">
                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {m.isMe && (
                  m.readAt
                    ? <CheckCheck className="w-3 h-3 text-blue-300 opacity-80" />
                    : <Check className="w-3 h-3 opacity-40" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] bg-[#030303]">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Mensagem..."
            rows={1}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-red-500/50 max-h-24"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="p-2.5 rounded-full bg-red-600 text-white disabled:opacity-30 transition-opacity shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
