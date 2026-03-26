/**
 * Setup script for ONEFIT B2B Evolution API instance.
 *
 * Run: npx tsx scripts/setup-onefit-evolution.ts
 *
 * Creates the "onefit-b2b" instance on the Evolution API server,
 * configures the webhook URL, and displays the QR code for pairing.
 *
 * Env vars (from .env or process.env):
 * - ONEFIT_EVOLUTION_URL or EVOLUTION_API_URL
 * - ONEFIT_EVOLUTION_KEY or EVOLUTION_API_KEY
 * - APP_URL (defaults to https://victor-app-seven.vercel.app)
 */

import "dotenv/config"

const EVOLUTION_URL =
  process.env.ONEFIT_EVOLUTION_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_KEY =
  process.env.ONEFIT_EVOLUTION_KEY || process.env.EVOLUTION_API_KEY
const APP_URL =
  process.env.APP_URL || "https://victor-app-seven.vercel.app"
const INSTANCE_NAME = "onefit-b2b"

async function setup() {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.error(
      "❌ Missing env vars. Set ONEFIT_EVOLUTION_URL + ONEFIT_EVOLUTION_KEY (or EVOLUTION_API_URL + EVOLUTION_API_KEY)"
    )
    process.exit(1)
  }

  console.log("═══════════════════════════════════════════════")
  console.log("  ONEFIT B2B — Evolution API Setup")
  console.log("═══════════════════════════════════════════════")
  console.log(`  Server: ${EVOLUTION_URL}`)
  console.log(`  App URL: ${APP_URL}`)
  console.log(`  Instance: ${INSTANCE_NAME}`)
  console.log("═══════════════════════════════════════════════\n")

  // 1. Create instance
  console.log("1/3 Creating instance...")
  try {
    const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    })

    const createData = await createRes.json()

    if (!createRes.ok) {
      // Instance may already exist
      if (
        JSON.stringify(createData).includes("already") ||
        JSON.stringify(createData).includes("exists")
      ) {
        console.log("   Instance already exists — skipping creation")
      } else {
        console.error("   Failed to create instance:", createData)
      }
    } else {
      console.log("   Instance created successfully!")
    }
  } catch (error) {
    console.error("   Error creating instance:", error)
  }

  // 2. Set webhook
  console.log("\n2/3 Configuring webhook...")
  try {
    const webhookUrl = `${APP_URL}/api/webhooks/onefit-evolution`

    const webhookRes = await fetch(
      `${EVOLUTION_URL}/webhook/set/${INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        }),
      }
    )

    const webhookData = await webhookRes.json()

    if (!webhookRes.ok) {
      console.error("   Failed to set webhook:", webhookData)
    } else {
      console.log(`   Webhook set to: ${webhookUrl}`)
    }
  } catch (error) {
    console.error("   Error setting webhook:", error)
  }

  // 3. Get QR Code
  console.log("\n3/3 Generating QR code...")
  try {
    const qrRes = await fetch(
      `${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`,
      {
        headers: { apikey: EVOLUTION_KEY },
      }
    )

    const qr = await qrRes.json()

    if (qr.base64) {
      console.log("\n══════════════════════════════════════")
      console.log("  QR CODE — Scan with WhatsApp")
      console.log("  Phone: 85 998500344")
      console.log("══════════════════════════════════════")
      console.log("\nBase64 QR (paste in browser or use a decoder):")
      console.log(qr.base64.slice(0, 200) + "...")
      console.log(
        "\nOr open the Evolution API dashboard to scan the QR code visually."
      )
    } else if (qr.code) {
      console.log("\nQR Code string:", qr.code)
    } else {
      console.log(
        "\nCheck the Evolution API dashboard for the QR code."
      )
      console.log("Response:", JSON.stringify(qr, null, 2))
    }
  } catch (error) {
    console.error("   Error getting QR code:", error)
  }

  console.log("\n═══════════════════════════════════════════════")
  console.log("  Setup complete!")
  console.log("")
  console.log("  Next steps:")
  console.log("  1. Scan the QR code with WhatsApp (85 998500344)")
  console.log("  2. Set ONEFIT_EVOLUTION_WEBHOOK_SECRET in Vercel")
  console.log("  3. Deploy and test by sending a message to the number")
  console.log("═══════════════════════════════════════════════")
}

setup().catch((error) => {
  console.error("Setup failed:", error)
  process.exit(1)
})
