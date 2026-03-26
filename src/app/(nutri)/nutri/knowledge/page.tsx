"use client"

import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

export default function NutriKnowledgePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600/15 to-emerald-900/10 border border-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-9 h-9 text-emerald-500/60" />
        </div>
        <h2 className="text-lg font-semibold text-white/80 mb-2">Base de Conhecimento IA</h2>
        <p className="text-neutral-500 text-sm">Em desenvolvimento</p>
      </motion.div>
    </div>
  )
}
