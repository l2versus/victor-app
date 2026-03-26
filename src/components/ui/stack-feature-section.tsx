"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Atom,
  Cloud,
  Container,
  Server,
  Globe,
  Triangle,
  Layers,
  Code,
  Github,
  MessageCircle,
  Linkedin,
  Instagram,
  Search,
  Apple,
  Facebook,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface OrbitingIconProps {
  icon: LucideIcon
  radius: number
  duration: number
  delay: number
  size?: number
  className?: string
}

function OrbitingIcon({
  icon: Icon,
  radius,
  duration,
  delay,
  size = 20,
  className,
}: OrbitingIconProps) {
  return (
    <motion.div
      className={cn(
        "absolute p-2 rounded-xl bg-neutral-900/80 border border-neutral-700/50 backdrop-blur-sm shadow-lg",
        className
      )}
      animate={{
        x: [
          Math.cos(0) * radius,
          Math.cos(Math.PI / 2) * radius,
          Math.cos(Math.PI) * radius,
          Math.cos((3 * Math.PI) / 2) * radius,
          Math.cos(Math.PI * 2) * radius,
        ],
        y: [
          Math.sin(0) * radius,
          Math.sin(Math.PI / 2) * radius,
          Math.sin(Math.PI) * radius,
          Math.sin((3 * Math.PI) / 2) * radius,
          Math.sin(Math.PI * 2) * radius,
        ],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <Icon size={size} className="text-neutral-300" />
    </motion.div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  index: number
}

function FeatureCard({ title, description, icon: Icon, index }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-red-500/30 transition-colors duration-300"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

const ORBIT_ICONS: { icon: LucideIcon; radius: number; duration: number; delay: number }[] = [
  { icon: Atom, radius: 120, duration: 20, delay: 0 },
  { icon: Cloud, radius: 120, duration: 20, delay: 5 },
  { icon: Container, radius: 120, duration: 20, delay: 10 },
  { icon: Server, radius: 120, duration: 20, delay: 15 },
  { icon: Globe, radius: 180, duration: 30, delay: 0 },
  { icon: Triangle, radius: 180, duration: 30, delay: 6 },
  { icon: Layers, radius: 180, duration: 30, delay: 12 },
  { icon: Code, radius: 180, duration: 30, delay: 18 },
  { icon: Github, radius: 180, duration: 30, delay: 24 },
  { icon: MessageCircle, radius: 240, duration: 40, delay: 0 },
  { icon: Linkedin, radius: 240, duration: 40, delay: 8 },
  { icon: Instagram, radius: 240, duration: 40, delay: 16 },
  { icon: Search, radius: 240, duration: 40, delay: 24 },
  { icon: Apple, radius: 240, duration: 40, delay: 32 },
  { icon: Facebook, radius: 240, duration: 40, delay: 36 },
]

const DEFAULT_FEATURES: FeatureCardProps[] = [
  {
    title: "AI-Powered",
    description: "Smart recommendations powered by cutting-edge machine learning models.",
    icon: Atom,
    index: 0,
  },
  {
    title: "Cloud Native",
    description: "Built for scale with serverless architecture and edge computing.",
    icon: Cloud,
    index: 1,
  },
  {
    title: "Real-time Sync",
    description: "Instant data synchronization across all your devices and platforms.",
    icon: Layers,
    index: 2,
  },
  {
    title: "Developer First",
    description: "Comprehensive APIs and SDKs for seamless integration.",
    icon: Code,
    index: 3,
  },
]

interface FeatureSectionProps {
  title?: string
  subtitle?: string
  features?: FeatureCardProps[]
  ctaText?: string
  onCtaClick?: () => void
  className?: string
}

export function FeatureSection({
  title = "Built with Modern Stack",
  subtitle = "Leveraging the best technologies to deliver exceptional performance and developer experience.",
  features = DEFAULT_FEATURES,
  ctaText = "Get Started",
  onCtaClick,
  className,
}: FeatureSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={sectionRef}
      className={cn("relative py-20 px-4 overflow-hidden", className)}
    >
      {/* Orbiting icons background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        {ORBIT_ICONS.map((item, i) => (
          <OrbitingIcon
            key={i}
            icon={item.icon}
            radius={item.radius}
            duration={item.duration}
            delay={item.delay}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            {subtitle}
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {features.map((feature, i) => (
            <FeatureCard
              key={i}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              index={i}
            />
          ))}
        </div>

        {/* CTA */}
        {ctaText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onCtaClick}
            >
              {ctaText}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export { OrbitingIcon, FeatureCard }
export default FeatureSection
