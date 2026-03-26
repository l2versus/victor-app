import { Resend } from "resend"

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = "Victor App <onboarding@resend.dev>"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// ═══════════════════════════════════════
// Shared email wrapper
// ═══════════════════════════════════════
function emailWrapper(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e5e5e5;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #fff; font-size: 22px; margin: 0;">Victor App</h1>
        <p style="color: #737373; font-size: 12px; margin-top: 4px;">Plataforma Fitness Profissional</p>
      </div>
      ${content}
      <hr style="border: none; border-top: 1px solid #262626; margin: 32px 0;" />
      <p style="font-size: 11px; color: #525252; text-align: center; line-height: 1.5;">
        Victor App — Plataforma Fitness White-Label
      </p>
    </div>
  `
}

function ctaButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        ${escapeHtml(text)}
      </a>
    </div>
  `
}

// ═══════════════════════════════════════
// 1. Welcome Professional
// ═══════════════════════════════════════
export async function sendWelcomeProfessional({
  to,
  name,
  loginUrl,
  trialDays = 14,
}: {
  to: string
  name: string
  loginUrl: string
  trialDays?: number
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn("[SaaS Email] RESEND_API_KEY not configured — skipping")
    return false
  }

  const firstName = escapeHtml(name.split(" ")[0])

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Bem-vindo a plataforma! Seu trial de ${trialDays} dias comecou`,
      html: emailWrapper(`
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Ola <strong style="color: #fff;">${firstName}</strong>!
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Seja muito bem-vindo a plataforma! Seu periodo de teste gratuito de
          <strong style="color: #dc2626;">${trialDays} dias</strong> ja comecou com
          acesso total ao plano <strong style="color: #fff;">Pro</strong>.
        </p>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #737373;">O QUE VOCE TEM ACESSO:</p>
          <ul style="margin: 0; padding-left: 20px; color: #d4d4d4; font-size: 14px; line-height: 2;">
            <li>Ate 3 profissionais e 100 alunos</li>
            <li>IA Chat + Bot pos-treino</li>
            <li>CRM + Pipeline de vendas</li>
            <li>WhatsApp Bot integrado</li>
            <li>Comunidade + Feed + Ranking</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #a3a3a3; line-height: 1.6;">
          Configure seu perfil, adicione exercicios e convide seus alunos.
          Estamos aqui para ajudar!
        </p>

        ${ctaButton("Acessar meu painel", loginUrl)}
      `),
    })
    console.log(`[SaaS Email] Welcome sent to ${to}`)
    return true
  } catch (error) {
    console.error("[SaaS Email] Failed:", error)
    return false
  }
}

// ═══════════════════════════════════════
// 2. Trial Ending
// ═══════════════════════════════════════
export async function sendTrialEnding({
  to,
  name,
  daysLeft,
  upgradeUrl,
}: {
  to: string
  name: string
  daysLeft: number
  upgradeUrl: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const firstName = escapeHtml(name.split(" ")[0])

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Seu trial expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`,
      html: emailWrapper(`
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Ola <strong style="color: #fff;">${firstName}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Seu periodo de teste gratuito expira em
          <strong style="color: #f59e0b;">${daysLeft} dia${daysLeft > 1 ? "s" : ""}</strong>.
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Para continuar usando todos os recursos sem interrupcao,
          escolha o plano ideal para voce:
        </p>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #737373;">PLANOS A PARTIR DE:</p>
          <p style="margin: 0; font-size: 28px; font-weight: 800; color: #fff;">
            R$97<span style="font-size: 14px; color: #737373; font-weight: 400;">/mes</span>
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #a3a3a3;">
            Plano anual com 30% de desconto
          </p>
        </div>

        ${ctaButton("Ver planos e assinar", upgradeUrl)}

        <p style="font-size: 13px; color: #737373; text-align: center;">
          Duvidas? Responda este email ou fale conosco pelo WhatsApp.
        </p>
      `),
    })
    console.log(`[SaaS Email] Trial ending sent to ${to}`)
    return true
  } catch (error) {
    console.error("[SaaS Email] Failed:", error)
    return false
  }
}

// ═══════════════════════════════════════
// 3. Trial Expired
// ═══════════════════════════════════════
export async function sendTrialExpired({
  to,
  name,
  upgradeUrl,
}: {
  to: string
  name: string
  upgradeUrl: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const firstName = escapeHtml(name.split(" ")[0])

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Seu trial expirou — assine para continuar",
      html: emailWrapper(`
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Ola <strong style="color: #fff;">${firstName}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Seu periodo de teste gratuito <strong style="color: #dc2626;">expirou</strong>.
          Para continuar gerenciando seus alunos e usando a plataforma,
          escolha um plano:
        </p>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #a3a3a3;">
            Seus dados estao seguros. Assine e continue de onde parou.
          </p>
          <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
            <div style="background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 16px; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #737373;">STARTER</p>
              <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #fff;">R$97</p>
            </div>
            <div style="background: #0a0a0a; border: 1px solid #dc2626; border-radius: 8px; padding: 16px; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #dc2626;">PRO</p>
              <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #fff;">R$197</p>
            </div>
            <div style="background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 16px; min-width: 120px;">
              <p style="margin: 0; font-size: 12px; color: #737373;">BUSINESS</p>
              <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #fff;">R$497</p>
            </div>
          </div>
        </div>

        ${ctaButton("Assinar agora", upgradeUrl)}
      `),
    })
    console.log(`[SaaS Email] Trial expired sent to ${to}`)
    return true
  } catch (error) {
    console.error("[SaaS Email] Failed:", error)
    return false
  }
}

// ═══════════════════════════════════════
// 4. New Student Joined
// ═══════════════════════════════════════
export async function sendNewStudentJoined({
  to,
  trainerName,
  studentName,
}: {
  to: string
  trainerName: string
  studentName: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const firstName = escapeHtml(trainerName.split(" ")[0])

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Novo aluno se cadastrou: ${studentName}`,
      html: emailWrapper(`
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Ola <strong style="color: #fff;">${firstName}</strong>!
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Um novo aluno acabou de se cadastrar na sua plataforma:
        </p>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #dc2626, #ef4444); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <span style="color: #fff; font-size: 20px; font-weight: 700;">${escapeHtml(studentName.charAt(0).toUpperCase())}</span>
          </div>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #fff;">${escapeHtml(studentName)}</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a3a3a3;">Novo aluno</p>
        </div>

        <p style="font-size: 14px; color: #a3a3a3; line-height: 1.6;">
          Acesse seu painel para configurar o treino e acompanhar esse aluno.
        </p>

        ${ctaButton("Ver alunos", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" + "/admin/students")}
      `),
    })
    console.log(`[SaaS Email] New student joined sent to ${to}`)
    return true
  } catch (error) {
    console.error("[SaaS Email] Failed:", error)
    return false
  }
}

// ═══════════════════════════════════════
// 5. Weekly Report
// ═══════════════════════════════════════
export async function sendWeeklyReport({
  to,
  name,
  stats,
}: {
  to: string
  name: string
  stats: {
    totalStudents: number
    activeStudents: number
    workoutsCompleted: number
    newStudents: number
  }
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const firstName = escapeHtml(name.split(" ")[0])

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Resumo semanal: ${stats.activeStudents} alunos ativos, ${stats.workoutsCompleted} treinos`,
      html: emailWrapper(`
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Ola <strong style="color: #fff;">${firstName}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
          Aqui esta o resumo da sua semana na plataforma:
        </p>

        <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #dc2626;">${stats.totalStudents}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373;">Total de alunos</p>
            </div>
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #10b981;">${stats.activeStudents}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373;">Alunos ativos</p>
            </div>
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #3b82f6;">${stats.workoutsCompleted}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373;">Treinos completos</p>
            </div>
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #f59e0b;">${stats.newStudents}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373;">Novos esta semana</p>
            </div>
          </div>
        </div>

        <p style="font-size: 14px; color: #a3a3a3; line-height: 1.6;">
          Continue acompanhando seus alunos e mantendo a qualidade.
          Bons treinos!
        </p>

        ${ctaButton("Abrir painel", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" + "/admin/dashboard")}
      `),
    })
    console.log(`[SaaS Email] Weekly report sent to ${to}`)
    return true
  } catch (error) {
    console.error("[SaaS Email] Failed:", error)
    return false
  }
}
