"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: "", phone: "" })
  const userMessageCount = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Show welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Oi! Sou o Victor Virtual, assistente do Victor Oliveira. Posso te ajudar com duvidas sobre treinos, planos e como funciona a consultoria. O que voce gostaria de saber?"
      }])
    }
  }, [open, messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage: Message = { role: "user", content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsStreaming(true)
    userMessageCount.current++

    // Após 3 msgs do user, pedir contato (se não capturou ainda)
    if (userMessageCount.current >= 3 && !leadCaptured && !showLeadForm) {
      setTimeout(() => setShowLeadForm(true), 1500)
    }

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.role === "user" || (m.role === "assistant" && m.content))
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro" }))
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: err.error || "Desculpe, tive um problema. Tente novamente ou fale com Victor no WhatsApp: (85) 9.9698-5823"
          }
          return updated
        })
        setIsStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No reader")

      let accumulated = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk

        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: accumulated }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Ops, algo deu errado. Tente novamente ou fale direto com Victor no WhatsApp: (85) 9.9698-5823"
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fechar chat" : "Falar com Victor Virtual"}
        className={cn(
          "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500",
          open
            ? "bg-zinc-800 text-white rotate-0 scale-90"
            : "bg-red-600 text-white hover:bg-red-500 shadow-red-600/30 hover:shadow-red-600/50 hover:scale-110 animate-bounce-slow"
        )}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Notification dot */}
      {!open && messages.length === 0 && (
        <div className="fixed bottom-[5.5rem] sm:bottom-[3.5rem] right-3 sm:right-5 z-[60] pointer-events-none">
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 sm:bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-96 max-h-[70dvh] rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-red-600/10 to-transparent flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-600/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Victor Virtual</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Online agora
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[50vh]">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-red-400" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-red-600 text-white rounded-br-md"
                    : "bg-white/[0.05] text-neutral-200 rounded-bl-md border border-white/[0.04]"
                )}>
                  {msg.content || (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Lead capture mini-form — aparece após 3 msgs */}
          {showLeadForm && !leadCaptured && (
            <div className="px-4 py-3 border-t border-white/[0.06] bg-red-600/5">
              <p className="text-[10px] text-neutral-400 mb-2">Quer que o Victor te responda pessoalmente?</p>
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!leadForm.name || !leadForm.phone) return
                try {
                  await fetch("/api/leads/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: leadForm.name,
                      phone: leadForm.phone,
                      source: "WEBSITE",
                      temperature: "WARM",
                      notes: `Chat widget: ${messages.filter(m => m.role === "user").map(m => m.content).join(" | ").slice(0, 300)}`,
                      tags: ["chat_widget"],
                    }),
                  })
                } catch { /* silent */ }
                setLeadCaptured(true)
                setShowLeadForm(false)
                setMessages(prev => [...prev, { role: "assistant", content: "Show! Victor vai te chamar no WhatsApp em breve. Enquanto isso, pode continuar perguntando aqui!" }])
              }} className="flex gap-2">
                <input type="text" placeholder="Nome" required value={leadForm.name} onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))}
                  className="flex-1 px-2.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40" />
                <input type="tel" placeholder="WhatsApp" required value={leadForm.phone} onChange={e => setLeadForm(p => ({ ...p, phone: e.target.value }))}
                  className="flex-1 px-2.5 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40" />
                <button type="submit" className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold shrink-0">Enviar</button>
              </form>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06] flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunte sobre planos, treinos..."
              disabled={isStreaming}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/40 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
