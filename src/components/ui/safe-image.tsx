"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string
  showIcon?: boolean
}

/**
 * Image with automatic error fallback.
 * When src fails to load, shows a neutral placeholder instead of broken icon.
 * Use this instead of raw <img> everywhere in the app.
 */
export function SafeImage({
  className,
  fallbackClassName,
  showIcon = true,
  alt = "",
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)

  if (error) {
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
    <img
      className={className}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  )
}

/**
 * Avatar with initial letter fallback.
 * Shows first letter of name when image fails.
 */
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
