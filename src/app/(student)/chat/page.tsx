"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send, Bot, User, Loader2, Sparkles,
  ChevronDown, RotateCcw, ArrowLeft, Dumbbell,
  Apple, Flame, HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { BRAND } from "@/lib/branding"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  { icon: Dumbbell, label: "Dúvida de treino", prompt: "Me explica a execução correta do supino inclinado" },
  { icon: Apple, label: "Nutrição", prompt: "O que devo comer antes do treino?" },
  { icon: Flame, label: "Pós-treino", prompt: "Como otimizar minha recuperação pós-treino?" },
  { icon: HelpCircle, label: "Dica geral", prompt: "Qual o melhor horário para treinar?" },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isFirstMessage = messages.length <= 1

  // Auto-scroll
  useEffect(() => {
    if (!showScrollBtn) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [messages, showScrollBtn])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            `Olá! Sou o assistente IA do ${BRAND.trainerFirstName}. Posso te ajudar com dúvidas sobre treino, nutrição, e coletar seu feedback pós-treino. Como posso ajudar?`,
        },
      ])
    }
  }, [])

  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100)
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    setShowScrollBtn(false)
  }

  async function sendMessage(text: string) {
    text = text.trim()
    if (!text || isStreaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text }
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")
    setIsStreaming(true)

    try {
      const apiMessages = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/student/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || ""
        let errorMsg = "Serviço temporariamente indisponível. Tente novamente em alguns segundos."
        if (contentType.includes("application/json")) {
          const data = await res.json()
          if (res.status === 401) errorMsg = "Sessão expirada. Faça login novamente."
          else if (res.status === 403) errorMsg = data.error || "Acesso negado."
          else if (data.error) errorMsg = data.error
        }
        throw new Error(errorMsg)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let accumulated = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const current = accumulated
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: current } : m))
          )
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error && err.message !== "Failed to fetch"
        ? err.message
        : "Não foi possível conectar ao assistente. Verifique sua conexão e tente novamente."
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: errorMessage }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleReset() {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/today"
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight">Assistente IA</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] text-neutral-500">Online agora</span>
            </div>
          </div>
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white transition-colors shrink-0"
            aria-label="Nova conversa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 relative scrollbar-thin"
      >
        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}

        {/* Suggestion chips — show only on welcome state */}
        {isFirstMessage && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="grid grid-cols-2 gap-2 pt-2"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.prompt)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-red-500/20 transition-all text-left group min-h-[44px]"
              >
                <s.icon className="w-3.5 h-3.5 text-red-400/70 group-hover:text-red-400 transition-colors shrink-0" />
                <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors leading-snug">
                  {s.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Scroll to bottom */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white shadow-lg backdrop-blur-sm transition-colors z-10"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 relative">
        <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden focus-within:border-red-500/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo..."
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent px-4 py-3 pr-12 text-sm text-white placeholder:text-neutral-600 resize-none outline-none disabled:opacity-50 max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={`absolute right-2 bottom-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isStreaming
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/30"
                : "bg-white/[0.06] text-neutral-600"
            }`}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-neutral-700 text-center mt-1.5">
          IA pode cometer erros · Consulte sempre seu personal
        </p>
      </form>
    </div>
  )
}

function ChatBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-white/[0.06] text-neutral-400"
            : "bg-gradient-to-br from-red-600/20 to-red-900/20 text-red-400 border border-red-500/10"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Content */}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-red-600/20 border border-red-500/20 text-neutral-200 rounded-tr-md"
            : "bg-white/[0.03] border border-white/[0.06] text-neutral-300 rounded-tl-md"
        }`}
      >
        {message.content ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : isStreaming ? (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/80 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
