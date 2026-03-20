import { Resend } from "resend"

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

/**
 * Send welcome email with temporary credentials to a new student
 * created automatically via Mercado Pago webhook.
 */
export async function sendWelcomeEmail({
  to,
  name,
  tempPassword,
  planName,
}: {
  to: string
  name: string
  tempPassword: string
  planName: string
}): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping email")
    return false
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000"
  const firstName = name.split(" ")[0]

  try {
    await resend.emails.send({
      from: "Victor App <onboarding@resend.dev>",
      to,
      subject: `Bem-vindo ao Victor App, ${firstName}!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e5e5e5;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #fff; font-size: 24px; margin: 0;">Victor App</h1>
            <p style="color: #737373; font-size: 13px; margin-top: 4px;">Personal Trainer Victor Oliveira</p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
            Ola <strong style="color: #fff;">${firstName}</strong>! 👋
          </p>

          <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
            Sua assinatura do plano <strong style="color: #dc2626;">${planName}</strong> foi confirmada com sucesso!
          </p>

          <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
            Aqui estao seus dados de acesso:
          </p>

          <div style="background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #737373;">SEU LOGIN</p>
            <p style="margin: 0 0 4px 0; font-size: 14px;">
              <span style="color: #a3a3a3;">Email:</span>
              <strong style="color: #fff;"> ${to}</strong>
            </p>
            <p style="margin: 0; font-size: 14px;">
              <span style="color: #a3a3a3;">Senha temporaria:</span>
              <strong style="color: #dc2626;"> ${tempPassword}</strong>
            </p>
          </div>

          <p style="font-size: 13px; color: #737373; line-height: 1.5;">
            Recomendamos trocar sua senha apos o primeiro acesso.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}/login" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Acessar o App
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #262626; margin: 32px 0;" />

          <p style="font-size: 12px; color: #525252; text-align: center; line-height: 1.5;">
            Duvidas? Fale com o Victor pelo WhatsApp: (85) 9.9698-5823
            <br />
            Victor Oliveira — Personal Trainer | CREF 016254-G/CE
          </p>
        </div>
      `,
    })

    console.log(`[Email] Welcome email sent to ${to}`)
    return true
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    return false
  }
}
