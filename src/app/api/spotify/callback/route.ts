import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForTokens, getSpotifyProfile } from "@/lib/spotify"

// GET /api/spotify/callback — Spotify redireciona aqui após login
// Rota PÚBLICA — studentId vem no state param
// Retorna HTML que fecha o popup e notifica a janela pai
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state") // = studentId
  const error = req.nextUrl.searchParams.get("error")

  if (error || !code || !state) {
    return new NextResponse(callbackHTML(false, "Acesso negado pelo Spotify"), {
      headers: { "Content-Type": "text/html" },
    })
  }

  // Verifica se o studentId é válido
  const student = await prisma.student.findUnique({
    where: { id: state },
    select: { id: true },
  })

  if (!student) {
    return new NextResponse(callbackHTML(false, "Sessão inválida"), {
      headers: { "Content-Type": "text/html" },
    })
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const profile = await getSpotifyProfile(tokens.access_token)

    await prisma.student.update({
      where: { id: student.id },
      data: {
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        spotifyExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        spotifyName: profile.name,
      },
    })

    return new NextResponse(callbackHTML(true, profile.name), {
      headers: { "Content-Type": "text/html" },
    })
  } catch (err) {
    console.error("[Spotify Callback]", err)
    return new NextResponse(callbackHTML(false, "Erro ao conectar"), {
      headers: { "Content-Type": "text/html" },
    })
  }
}

function callbackHTML(success: boolean, message: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spotify — ${success ? "Conectado" : "Erro"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0a; color: #fff; font-family: -apple-system, sans-serif;
    display: flex; align-items: center; justify-content: center; height: 100vh; }
  .card { text-align: center; padding: 2rem; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  .title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
  .sub { color: #888; font-size: 0.875rem; }
</style></head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "❌"}</div>
    <div class="title">${success ? "Spotify Conectado!" : "Erro"}</div>
    <div class="sub">${success ? message : message}<br>Fechando...</div>
  </div>
  <script>
    // Notifica a janela pai e fecha o popup
    if (window.opener) {
      window.opener.postMessage({ type: "spotify-callback", success: ${success} }, "*");
    }
    setTimeout(function() { window.close(); }, 1500);
  </script>
</body></html>`
}
