"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { MapPin, ExternalLink } from "lucide-react"

interface LocationMapProps {
  location?: string
  coordinates?: string
  className?: string
}

export function LocationMap({
  location = "Av. Maj. Joaquim Monteiro Patto, 25 - Taubaté/SP",
  coordinates = "23.0205° S, 45.5577° W",
  className,
}: LocationMapProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-50, 50], [8, -8])
  const rotateY = useTransform(mouseX, [-50, 50], [-8, 8])

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const handleClick = () => {
    setIsExpanded(!isExpanded)
  }

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Maj.+Joaquim+Monteiro+Patto,+25+-+Chácara+do+Visconde,+Taubaté+-+SP,+12050-620",
      "_blank"
    )
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full aspect-square max-w-md cursor-pointer ${className}`}
      style={{
        perspective: 1000,
        rotateX: springRotateX,
        rotateY: springRotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <motion.div
        className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/80 backdrop-blur-xl"
        animate={{
          scale: isExpanded ? 1.02 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Streets pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Main roads - horizontal */}
                  <line x1="0" y1="35" x2="100" y2="35" stroke="currentColor" strokeWidth="0.8" className="text-white" />
                  <line x1="0" y1="65" x2="100" y2="65" stroke="currentColor" strokeWidth="0.8" className="text-white" />

                  {/* Main roads - vertical */}
                  <line x1="30" y1="0" x2="30" y2="100" stroke="currentColor" strokeWidth="0.8" className="text-white" />
                  <line x1="70" y1="0" x2="70" y2="100" stroke="currentColor" strokeWidth="0.8" className="text-white" />

                  {/* Secondary streets */}
                  {[20, 50, 80].map((y, i) => (
                    <line key={`h-${i}`} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.3" className="text-white/50" />
                  ))}
                  {[15, 45, 55, 85].map((x, i) => (
                    <line key={`v-${i}`} x1={x} y1="0" x2={x} y2="100" stroke="currentColor" strokeWidth="0.3" className="text-white/50" />
                  ))}
                </svg>
              </div>

              {/* Buildings */}
              <motion.div
                className="absolute top-[15%] left-[10%] w-[15%] h-[12%] bg-white/10 rounded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              />
              <motion.div
                className="absolute top-[40%] left-[75%] w-[18%] h-[20%] bg-white/10 rounded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              />
              <motion.div
                className="absolute top-[70%] left-[15%] w-[20%] h-[15%] bg-white/10 rounded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              />
              <motion.div
                className="absolute top-[20%] left-[50%] w-[12%] h-[18%] bg-white/10 rounded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
              />
              <motion.div
                className="absolute top-[55%] left-[35%] w-[15%] h-[12%] bg-white/10 rounded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              />

              {/* Location pin with pulse */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-[#E59935] rounded-full"
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="w-4 h-4 bg-[#E59935] rounded-full border-2 border-white shadow-lg" />
                </div>
              </motion.div>

              <motion.button
                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-[#E59935] text-white text-sm font-medium rounded-full hover:bg-[#CC8830] transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={openGoogleMaps}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no Maps
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid pattern - only show when collapsed */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: isExpanded ? 0 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-white/30" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </motion.div>

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          {/* Top section */}
          <div className="flex items-start justify-between">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-[#E59935]/20 backdrop-blur-sm flex items-center justify-center border border-[#E59935]/30"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <MapPin className="w-6 h-6 text-[#E59935]" />
            </motion.div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-white/70 text-xs font-medium">Aberto</span>
            </div>
          </div>

          {/* Bottom section */}
          <div className="space-y-2">
            <motion.h3
              className="text-xl font-semibold text-white"
              animate={{ y: isExpanded ? -5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {location}
            </motion.h3>

            <AnimatePresence>
              {isExpanded && (
                <motion.p
                  className="text-white/50 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {coordinates}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Animated underline */}
            <motion.div
              className="h-0.5 bg-gradient-to-r from-[#E59935] to-orange-500 rounded-full"
              animate={{ width: isHovered ? "100%" : "30%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Click hint */}
      <motion.p
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs"
        animate={{ opacity: isHovered && !isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        Clique para expandir
      </motion.p>
    </motion.div>
  )
}
