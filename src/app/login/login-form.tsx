"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Show session expired message if redirected from another device login
  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setError("Sua sessao foi encerrada pois outro dispositivo fez login nesta conta.")
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login")
        return
      }

      if (data.user.role === "MASTER") {
        router.push("/master/dashboard")
      } else if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard")
      } else if (data.user.role === "NUTRITIONIST") {
        router.push("/nutri/dashboard")
      } else {
        router.push("/today")
      }
    } catch {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar ao site
      </Link>

      <div className="text-center mb-8 lg:text-left">
        <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
        <p className="text-sm text-neutral-400">Entre na sua conta para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all"
            placeholder="seu@email.com" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">Senha</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all"
            placeholder="Sua senha" />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20 hover:shadow-red-500/30">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-xs text-neutral-500 mt-6">
        Nao tem conta?{" "}
        <a href="/register" className="text-red-400 hover:text-red-300 transition-colors">Cadastre-se</a>
      </p>
    </AuthLayout>
  )
}
