import "react"

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          ar?: boolean
          "ar-modes"?: string
          "ar-scale"?: string
          "ios-src"?: string
          poster?: string
          loading?: "auto" | "lazy" | "eager"
          reveal?: "auto" | "interaction" | "manual"
          alt?: string
          "camera-controls"?: boolean
          "touch-action"?: string
          "auto-rotate"?: boolean
          "auto-rotate-delay"?: number
          "rotation-per-second"?: string
          "shadow-intensity"?: string
          "environment-image"?: string
          exposure?: string
        },
        HTMLElement
      >
    }
  }
}
