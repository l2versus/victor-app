import { MessageCircle, Sparkles } from "lucide-react"

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/10 flex items-center justify-center backdrop-blur-xl">
          <MessageCircle className="w-9 h-9 text-purple-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Chat com IA</h2>
      <p className="text-neutral-500 text-sm max-w-xs mb-4">
        Tire dúvidas sobre treino, nutrição e recuperação com inteligência artificial personalizada.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/5 border border-purple-500/15 text-purple-400 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
        Em breve — Sessão 4
      </div>
    </div>
  )
}
