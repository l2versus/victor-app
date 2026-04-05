declare module "@mediapipe/tasks-vision" {
  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<FilesetResolver>
  }

  export interface PoseLandmarkerOptions {
    baseOptions: {
      modelAssetPath: string
      delegate?: "GPU" | "CPU"
    }
    runningMode: "IMAGE" | "VIDEO"
    numPoses?: number
  }

  export interface NormalizedLandmark {
    x: number
    y: number
    z?: number
    visibility?: number
  }

  export interface WorldLandmark {
    x: number  // meters, relative to hip center
    y: number
    z: number
    visibility?: number
  }

  export interface PoseLandmarkerResult {
    landmarks: NormalizedLandmark[][]
    worldLandmarks: WorldLandmark[][]
  }

  export interface Connection {
    start: number
    end: number
  }

  export class PoseLandmarker {
    static POSE_CONNECTIONS: Connection[]
    static createFromOptions(
      resolver: FilesetResolver,
      options: PoseLandmarkerOptions
    ): Promise<PoseLandmarker>
    detectForVideo(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult
    close(): void
  }

  export interface DrawingOptions {
    color?: string
    lineWidth?: number
    radius?: number
  }

  export class DrawingUtils {
    constructor(ctx: CanvasRenderingContext2D)
    drawConnectors(
      landmarks: NormalizedLandmark[],
      connections: Connection[],
      options?: DrawingOptions
    ): void
    drawLandmarks(
      landmarks: NormalizedLandmark[],
      options?: DrawingOptions
    ): void
  }
}
