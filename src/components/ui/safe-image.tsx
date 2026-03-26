"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string
  showIcon?: boolean
}

export function SafeImage({
  className,
  fallbackClassName,
  showIcon = true,
  alt = "",
  src,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // If no src at all, show fallback immediately
  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-900",
          className,
          fallbackClassName
        )}
        role="img"
        aria-label={alt}
      >
        {showIcon && <ImageOff className="w-5 h-5 text-neutral-700" />}
      </div>
    )
  }

  return (
    <div className={cn("relative bg-neutral-900", className, fallbackClassName)}>
      {/* Placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <div className="w-4 h-4 rounded-full border-2 border-neutral-700 border-t-neutral-500 animate-spin" />
        </div>
      )}
      <img
        src={src}
        className={cn("w-full h-full object-cover", !loaded && "opacity-0")}
        alt={alt}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        {...props}
      />
    </div>
  )
}

export function SafeAvatar({
  src,
  name,
  className,
  size = "md",
}: {
  src: string | null | undefined
  name: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const [error, setError] = useState(false)
  const initial = name.charAt(0).toUpperCase()
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" }

  if (!src || error) {
    return (
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 font-bold",
          sizes[size],
          className
        )}
      >
        {initial}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={cn("rounded-full object-cover", sizes[size], className)}
    />
  )
}
