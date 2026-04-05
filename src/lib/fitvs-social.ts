// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — FitVS Social Layer (TikTok Live Style)
//
// Adds spectator mode, live chat, stickers, and gifts to FitVS battles.
//
// Features:
//   - Spectator mode: anyone with the link can WATCH (read-only stream)
//   - Live chat: floating messages like TikTok Live
//   - Stickers: animated reactions (💪🔥⚡👏🏆) that float up
//   - Gifts: viewers can send virtual gifts that appear on screen
//   - Gift XP: gifts give XP to the fighters (gamification)
//
// Architecture:
//   - Chat/stickers/gifts via API polling (MVP — no WebSocket needed)
//   - Spectators see recorded canvas stream via HLS/WebRTC fan-out (future)
//   - For MVP: spectators see score updates + chat (no live video)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Sticker Definitions ───────────────────────────────────────────────────

export interface Sticker {
  id: string
  emoji: string
  label: string
  /** Animation duration in ms */
  duration: number
  /** Size multiplier (1 = normal, 2 = big) */
  size: number
}

export const STICKERS: Sticker[] = [
  { id: "fire", emoji: "🔥", label: "Fogo!", duration: 2000, size: 1 },
  { id: "muscle", emoji: "💪", label: "Força!", duration: 2000, size: 1 },
  { id: "lightning", emoji: "⚡", label: "Incrível!", duration: 1800, size: 1 },
  { id: "clap", emoji: "👏", label: "Bravo!", duration: 1500, size: 1 },
  { id: "trophy", emoji: "🏆", label: "Campeão!", duration: 2500, size: 1.3 },
  { id: "skull", emoji: "💀", label: "Destruiu!", duration: 2000, size: 1 },
  { id: "heart", emoji: "❤️", label: "Amei!", duration: 1800, size: 1 },
  { id: "hundred", emoji: "💯", label: "Perfeito!", duration: 2000, size: 1.2 },
]

// ─── Gift Definitions ──────────────────────────────────────────────────────

export interface Gift {
  id: string
  emoji: string
  label: string
  /** XP value this gift gives to the fighter */
  xpValue: number
  /** Cost in coins (future monetization) */
  coinCost: number
  /** Animation type */
  animation: "float" | "explode" | "rain"
  /** Rarity for visual effects */
  rarity: "common" | "rare" | "epic" | "legendary"
}

export const GIFTS: Gift[] = [
  { id: "water", emoji: "💧", label: "Água", xpValue: 1, coinCost: 0, animation: "float", rarity: "common" },
  { id: "protein", emoji: "🥤", label: "Whey", xpValue: 5, coinCost: 0, animation: "float", rarity: "common" },
  { id: "dumbbell", emoji: "🏋️", label: "Halter", xpValue: 10, coinCost: 1, animation: "float", rarity: "rare" },
  { id: "medal", emoji: "🥇", label: "Medalha", xpValue: 25, coinCost: 5, animation: "explode", rarity: "rare" },
  { id: "crown", emoji: "👑", label: "Coroa", xpValue: 50, coinCost: 10, animation: "explode", rarity: "epic" },
  { id: "diamond", emoji: "💎", label: "Diamante", xpValue: 100, coinCost: 25, animation: "rain", rarity: "epic" },
  { id: "rocket", emoji: "🚀", label: "Foguete", xpValue: 250, coinCost: 50, animation: "rain", rarity: "legendary" },
  { id: "titan", emoji: "⚔️", label: "TITAN", xpValue: 500, coinCost: 100, animation: "rain", rarity: "legendary" },
]

// ─── Chat Message ──────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  userName: string
  text: string
  timestamp: number
  /** If this is a sticker reaction */
  sticker?: Sticker
  /** If this is a gift */
  gift?: Gift
  /** Which fighter the gift is for */
  giftTarget?: "player1" | "player2"
}

// ─── Floating Animation Item (for rendering) ──────────────────────────────

export interface FloatingItem {
  id: string
  emoji: string
  x: number // 0-100 (percentage)
  y: number // starts at 100, floats to 0
  size: number
  opacity: number
  startTime: number
  duration: number
  animation: "float" | "explode" | "rain"
}

// ─── Chat/Sticker Manager ──────────────────────────────────────────────────

export class FitVSSocialManager {
  messages: ChatMessage[] = []
  floatingItems: FloatingItem[] = []
  onUpdate: (() => void) | null = null

  private nextId = 0
  private maxMessages = 50

  /** Add a chat message */
  addMessage(userName: string, text: string) {
    this.messages.push({
      id: String(this.nextId++),
      userName,
      text,
      timestamp: Date.now(),
    })
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
    this.onUpdate?.()
  }

  /** Add a sticker reaction */
  addSticker(userName: string, sticker: Sticker) {
    // Chat entry
    this.messages.push({
      id: String(this.nextId++),
      userName,
      text: "",
      timestamp: Date.now(),
      sticker,
    })
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }

    // Floating animation
    this.spawnFloating(sticker.emoji, sticker.duration, sticker.size, "float")
    this.onUpdate?.()
  }

  /** Add a gift with animation */
  addGift(userName: string, gift: Gift, target: "player1" | "player2") {
    // Chat entry
    this.messages.push({
      id: String(this.nextId++),
      userName,
      text: "",
      timestamp: Date.now(),
      gift,
      giftTarget: target,
    })
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }

    // Spawn multiple floating items based on rarity
    const count = gift.rarity === "legendary" ? 12 : gift.rarity === "epic" ? 8 : gift.rarity === "rare" ? 4 : 2
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.spawnFloating(gift.emoji, 2500, gift.rarity === "legendary" ? 1.8 : 1.2, gift.animation)
        this.onUpdate?.()
      }, i * 150)
    }

    this.onUpdate?.()
  }

  private spawnFloating(emoji: string, duration: number, size: number, animation: "float" | "explode" | "rain") {
    this.floatingItems.push({
      id: String(this.nextId++),
      emoji,
      x: 10 + Math.random() * 80,
      y: 100,
      size,
      opacity: 1,
      startTime: Date.now(),
      duration,
      animation,
    })

    // Cleanup old items
    const now = Date.now()
    this.floatingItems = this.floatingItems.filter(item => now - item.startTime < item.duration + 500)
  }

  /** Get animation progress for a floating item (0 = start, 1 = end) */
  getProgress(item: FloatingItem): { x: number; y: number; opacity: number; scale: number } {
    const elapsed = Date.now() - item.startTime
    const t = Math.min(1, elapsed / item.duration)

    if (item.animation === "float") {
      return {
        x: item.x + Math.sin(t * Math.PI * 3) * 10,
        y: item.y - t * 100,
        opacity: t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1,
        scale: item.size * (1 + Math.sin(t * Math.PI) * 0.3),
      }
    }

    if (item.animation === "explode") {
      const angle = item.x * 0.0628 // Spread based on initial position
      return {
        x: 50 + Math.cos(angle + t * 2) * (t * 40),
        y: 50 - Math.sin(angle + t * 2) * (t * 40),
        opacity: t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1,
        scale: item.size * (0.5 + t * 1.5),
      }
    }

    // rain
    return {
      x: item.x + Math.sin(t * Math.PI * 2) * 5,
      y: t * 110 - 10,
      opacity: t > 0.8 ? 1 - (t - 0.8) / 0.2 : Math.min(1, t * 3),
      scale: item.size,
    }
  }
}

/** Rarity border colors for gift display */
export function rarityColor(rarity: Gift["rarity"]): string {
  switch (rarity) {
    case "common": return "border-neutral-500/30"
    case "rare": return "border-blue-500/50"
    case "epic": return "border-purple-500/60"
    case "legendary": return "border-amber-400/70"
  }
}

export function rarityGlow(rarity: Gift["rarity"]): string {
  switch (rarity) {
    case "common": return ""
    case "rare": return "shadow-blue-500/20 shadow-lg"
    case "epic": return "shadow-purple-500/30 shadow-lg"
    case "legendary": return "shadow-amber-400/40 shadow-xl animate-pulse"
  }
}
