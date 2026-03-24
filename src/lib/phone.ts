/**
 * Normalização de telefone — UMA função pra todo o sistema.
 *
 * Regras:
 * 1. Remove tudo que não é número
 * 2. Garante prefixo 55 (Brasil)
 * 3. Não duplica o 55
 * 4. Retorna apenas dígitos: "5585999086924"
 */

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""

  // Já tem 55 na frente e tamanho correto (12-13 dígitos)
  if (digits.startsWith("55") && digits.length >= 12) return digits

  // Tem 10-11 dígitos (DDD + número) — adiciona 55
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`

  // Tem 8-9 dígitos (sem DDD) — não tem como saber o DDD, retorna como veio
  return digits
}

/**
 * Extrai os últimos 8 dígitos pra busca "contains" no banco.
 * Útil pra encontrar lead mesmo se o formato é diferente.
 */
export function phoneSearchSuffix(raw: string | null | undefined): string {
  const normalized = normalizePhone(raw)
  return normalized.slice(-8)
}

/**
 * Formata pra exibição: (85) 99908-6924
 */
export function formatPhone(raw: string | null | undefined): string {
  const digits = normalizePhone(raw)
  if (!digits) return ""

  // Remove 55 pra exibição brasileira
  const local = digits.startsWith("55") ? digits.slice(2) : digits

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return local
}
