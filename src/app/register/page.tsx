"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role: "STUDENT" }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao cadastrar")
        return
      }

      router.push("/today")
    } catch {
      setError("Erro de conexao")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all"

  return (
    <AuthLayout>
      <div className="text-center mb-8 lg:text-left">
        <h1 className="text-2xl font-bold text-white mb-1">Criar Conta</h1>
        <p className="text-sm text-neutral-400">Comece sua transformacao com Victor</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1.5">Nome</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Seu nome completo" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} placeholder="seu@email.com" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-1.5">WhatsApp</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(85) 99999-9999" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">Senha</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={6} className={inputClass} placeholder="Minimo 6 caracteres" />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20 hover:shadow-red-500/30">
          {loading ? "Cadastrando..." : "Criar Conta"}
        </button>
      </form>

      <p className="text-center text-xs text-neutral-500 mt-6">
        Ja tem conta?{" "}
        <a href="/login" className="text-red-400 hover:text-red-300 transition-colors">Fazer login</a>
      </p>
    </AuthLayout>
  )
}
