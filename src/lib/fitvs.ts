// ══════════════════════════════════════════════════════════════════════════════
// VICTOR APP — FitVS Battle System (TikTok VS Style)
//
// Peer-to-peer fitness battles where two users compete in real-time
// exercise form via split-screen video with MediaPipe scoring.
//
// Architecture (MVP — no WebSocket server needed):
//   - Room creation: generates unique room ID
//   - Signaling: API routes relay WebRTC offers/answers via short-lived DB records
//   - Video: WebRTC peer-to-peer (no server relay after connection)
//   - Scoring: Each device runs MediaPipe locally, sends scores via DataChannel
//   - Recording: Canvas capture for social sharing
//
// Flow:
//   1. Player 1 creates room → gets room ID/link
//   2. Player 2 joins via link → WebRTC handshake
//   3. Both select same exercise, countdown 3-2-1
//   4. MediaPipe runs on both devices, scores sent via DataChannel
//   5. After N reps or time limit → results screen
//   6. Recorded video can be shared to social media
// ══════════════════════════════════════════════════════════════════════════════

// ─── Types ─────────────────────────────────────────────────────────────────

export type BattleStatus = "waiting" | "connecting" | "countdown" | "fighting" | "finished"
export type BattleRole = "host" | "guest"

export interface BattleState {
  roomId: string
  status: BattleStatus
  role: BattleRole
  exerciseId: string
  exerciseName: string
  /** Target reps to complete the battle */
  targetReps: number
  /** My current score */
  myScore: number
  myReps: number
  myFormGrade: string
  /** Opponent's current score */
  opponentScore: number
  opponentReps: number
  opponentFormGrade: string
  /** Countdown value (3, 2, 1, GO!) */
  countdown: number
  /** Winner when finished */
  winner: "me" | "opponent" | "draw" | null
  /** Connection state */
  connected: boolean
  /** Opponent's name */
  opponentName: string
}

export interface ScoreMessage {
  type: "score"
  score: number
  reps: number
  grade: string
  timestamp: number
}

export interface ControlMessage {
  type: "ready" | "start" | "finish" | "name"
  payload?: string
}

export type DataMessage = ScoreMessage | ControlMessage

// ─── Room ID Generation ────────────────────────────────────────────────────

/** Generate a short, human-readable room ID */
export function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // No ambiguous chars (0/O, 1/I)
  let id = ""
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

/** Generate a shareable battle link */
export function getBattleLink(roomId: string): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/posture/fitvs?room=${roomId}`
}

// ─── Initial State ─────────────────────────────────────────────────────────

export function createBattleState(role: BattleRole, roomId: string): BattleState {
  return {
    roomId,
    status: "waiting",
    role,
    exerciseId: "squat",
    exerciseName: "Agachamento",
    targetReps: 5,
    myScore: 0,
    myReps: 0,
    myFormGrade: "-",
    opponentScore: 0,
    opponentReps: 0,
    opponentFormGrade: "-",
    countdown: 3,
    connected: false,
    winner: null,
    opponentName: "Oponente",
  }
}

// ─── WebRTC Peer Connection Manager ────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
]

export class FitVSConnection {
  pc: RTCPeerConnection
  dataChannel: RTCDataChannel | null = null
  remoteStream: MediaStream | null = null
  onRemoteStream: ((stream: MediaStream) => void) | null = null
  onData: ((msg: DataMessage) => void) | null = null
  onConnectionChange: ((connected: boolean) => void) | null = null

  private localStream: MediaStream | null = null

  constructor() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    this.pc.ontrack = (event) => {
      this.remoteStream = event.streams[0] || new MediaStream([event.track])
      this.onRemoteStream?.(this.remoteStream)
    }

    this.pc.oniceconnectionstatechange = () => {
      const connected = this.pc.iceConnectionState === "connected" || this.pc.iceConnectionState === "completed"
      this.onConnectionChange?.(connected)
    }

    this.pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel)
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel
    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as DataMessage
        this.onData?.(msg)
      } catch { /* ignore bad messages */ }
    }
  }

  /** Attach local camera stream */
  async attachLocalStream(stream: MediaStream) {
    this.localStream = stream
    for (const track of stream.getTracks()) {
      this.pc.addTrack(track, stream)
    }
  }

  /** Host: create offer + data channel */
  async createOffer(): Promise<string> {
    this.setupDataChannel(
      this.pc.createDataChannel("fitvs", { ordered: true })
    )

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    // Wait for ICE gathering to complete
    await this.waitForIceGathering()

    return JSON.stringify(this.pc.localDescription)
  }

  /** Guest: accept offer, create answer */
  async acceptOffer(offerSdp: string): Promise<string> {
    const offer = JSON.parse(offerSdp) as RTCSessionDescriptionInit
    if (!offer || !offer.sdp || (offer.type !== "offer" && offer.type !== "answer")) {
      throw new Error("Invalid SDP received")
    }
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    await this.waitForIceGathering()

    return JSON.stringify(this.pc.localDescription)
  }

  /** Host: accept answer from guest */
  async acceptAnswer(answerSdp: string) {
    const answer = JSON.parse(answerSdp) as RTCSessionDescriptionInit
    if (!answer || !answer.sdp || (answer.type !== "offer" && answer.type !== "answer")) {
      throw new Error("Invalid SDP received")
    }
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  /** Send data to peer */
  send(msg: DataMessage) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(msg))
    }
  }

  /** Close connection */
  close() {
    this.dataChannel?.close()
    this.pc.close()
    this.localStream?.getTracks().forEach(t => t.stop())
  }

  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === "complete") {
        resolve()
        return
      }
      const timeout = setTimeout(resolve, 3000) // Max 3s wait
      this.pc.onicegatheringstatechange = () => {
        if (this.pc.iceGatheringState === "complete") {
          clearTimeout(timeout)
          resolve()
        }
      }
    })
  }
}

// ─── Score Calculation ─────────────────────────────────────────────────────

/** Convert multi-dimensional score to a battle-friendly single number */
export function calculateBattleScore(
  formScore: number,
  reps: number,
  targetReps: number,
): number {
  // Form quality is 70% of score, completion is 30%
  const completionBonus = Math.min(1, reps / targetReps) * 30
  const formPoints = (formScore / 100) * 70
  return Math.round(formPoints + completionBonus)
}

/** Determine winner based on final scores */
export function determineWinner(
  myScore: number,
  opponentScore: number,
): "me" | "opponent" | "draw" {
  if (myScore > opponentScore) return "me"
  if (opponentScore > myScore) return "opponent"
  return "draw"
}
