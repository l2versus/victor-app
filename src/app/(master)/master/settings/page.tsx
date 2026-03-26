"use client"

import { motion } from "framer-motion"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-900/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-5">
          <Settings className="w-7 h-7 text-violet-500" />
        </div>
        <h2 className="text-lg font-bold text-white/90 mb-1">Configuracoes</h2>
        <p className="text-neutral-500 text-sm">Em desenvolvimento</p>
      </motion.div>
    </div>
  )
}
