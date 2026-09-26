import { motion } from 'motion/react'
import { cn } from './ui'

export function PaperClip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 78" className={cn('pointer-events-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.55)]', className)} aria-hidden>
      <defs>
        <linearGradient id="clip-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#8d877c" />
          <stop offset=".45" stopColor="#d9d2c4" />
          <stop offset="1" stopColor="#6f6a61" />
        </linearGradient>
      </defs>
      <path
        d="M9 56V14a5 5 0 0 1 10 0v48a8 8 0 0 1-16 0V20"
        fill="none"
        stroke="url(#clip-metal)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Pencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 26" className={cn('pointer-events-none drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)]', className)} aria-hidden>
      <defs>
        <linearGradient id="pencil-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3935" />
          <stop offset=".5" stopColor="#2a2926" />
          <stop offset="1" stopColor="#1c1b19" />
        </linearGradient>
        <linearGradient id="pencil-ferrule" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8b0a0" />
          <stop offset=".5" stopColor="#7e776b" />
          <stop offset="1" stopColor="#5b564d" />
        </linearGradient>
      </defs>
      <rect x="10" y="4" width="26" height="18" rx="4" fill="#9c4a3a" />
      <rect x="30" y="3" width="24" height="20" fill="url(#pencil-ferrule)" />
      <rect x="54" y="3" width="196" height="20" fill="url(#pencil-body)" />
      <path d="M250 3 L284 13 L250 23 Z" fill="#c9b596" />
      <path d="M276 10.6 L292 13 L276 15.4 Z" fill="#2b2926" />
      <text x="70" y="17" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="2" fill="#6d675d">MDIFY · HB · 02</text>
    </svg>
  )
}

export function StampPad({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 104" className={cn('pointer-events-none drop-shadow-[0_10px_12px_rgba(0,0,0,0.6)]', className)} aria-hidden>
      <rect x="2" y="2" width="146" height="100" rx="10" fill="#22201d" stroke="#34312d" />
      <rect x="14" y="14" width="122" height="76" rx="5" fill="#6a2517" />
      <rect x="14" y="14" width="122" height="76" rx="5" fill="url(#pad-fibre)" opacity=".5" />
      <defs>
        <pattern id="pad-fibre" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".6" fill="#8e3421" />
          <circle cx="3" cy="3" r=".5" fill="#4f1a10" />
        </pattern>
      </defs>
      <ellipse cx="60" cy="46" rx="30" ry="14" fill="#8c3320" opacity=".45" />
    </svg>
  )
}

/** Decorative objects scattered around the edges of the desk (wide screens only). */
export function DeskObjects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden max-xl:hidden" aria-hidden>
      <motion.div
        className="absolute -left-10 bottom-[9%] w-[300px] rotate-[-24deg]"
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.3 }}
      >
        <Pencil />
      </motion.div>
      <motion.div
        className="absolute -right-6 bottom-[14%] w-[150px] rotate-[11deg]"
        initial={{ x: 120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.4 }}
      >
        <StampPad />
      </motion.div>
    </div>
  )
}
