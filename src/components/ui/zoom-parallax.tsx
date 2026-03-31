'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import { useRef } from 'react'

interface ZoomImage {
  src: string
  alt?: string
}

interface ZoomParallaxProps {
  images: ZoomImage[]
  className?: string
}

export function ZoomParallax({ images, className = "" }: ZoomParallaxProps) {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  })

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4])
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5])
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6])
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8])
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9])
  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9]

  const positions = [
    '',
    '[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]',
    '[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]',
    '[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]',
    '[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]',
    '[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]',
    '[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]',
  ]

  return (
    <div ref={container} className={`relative h-[150vh] bg-[#0a0a0a] ${className}`}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {images.slice(0, 7).map(({ src, alt }, index) => (
          <motion.div
            key={index}
            style={{ scale: scales[index % scales.length] }}
            className={`absolute top-0 flex h-full w-full items-center justify-center ${positions[index] || ''}`}
          >
            <div className="relative h-[25vh] w-[25vw]">
              <img
                src={src}
                alt={alt || `Image ${index + 1}`}
                className="h-full w-full object-cover rounded-lg shadow-2xl shadow-black/50"
                loading="lazy"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
