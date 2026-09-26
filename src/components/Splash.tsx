import { useEffect, useRef, useState } from 'react'
import { bell, keyStrike } from '../lib/typewriter'
import { AnimatePresence, motion } from 'motion/react'

const WORD = 'Mdify'
const TAGLINE = 'Anything in · Markdown out'

// Timeline (ms from mount)
const T_HASH = 350
const T_WORD = 800
const CHAR_MS = 95
const T_STRIP = T_WORD + WORD.length * CHAR_MS + 250
const T_DOT = T_STRIP + 350
const T_TAG = T_DOT + 250
const TAG_MS = 22
const T_EXIT = T_TAG + TAGLINE.length * TAG_MS + 650

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Splash({ onLeaving, onDone }: { onLeaving: () => void; onDone: () => void }) {
  const [t, setT] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (reduced) {
      const id = setTimeout(() => setLeaving(true), 700)
      return () => clearTimeout(id)
    }
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const now = performance.now() - start
      setT(now)
      if (now >= T_EXIT) setLeaving(true)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => { if (leaving) onLeaving() }, [leaving, onLeaving])

  useEffect(() => {
    if (leaving) return
    const skip = (e: Event) => { e.preventDefault(); e.stopPropagation(); setLeaving(true) }
    window.addEventListener('keydown', skip, true)
    window.addEventListener('pointerdown', skip, true)
    return () => { window.removeEventListener('keydown', skip, true); window.removeEventListener('pointerdown', skip, true) }
  }, [leaving])

  const typed = reduced ? WORD.length : Math.max(0, Math.min(WORD.length, Math.floor((t - T_WORD) / CHAR_MS) + 1))
  const showHash = !reduced && t >= T_HASH && t < T_STRIP
  const stripped = reduced || t >= T_STRIP
  const dot = reduced || t >= T_DOT
  const tagChars = reduced ? TAGLINE.length : Math.max(0, Math.min(TAGLINE.length, Math.floor((t - T_TAG) / TAG_MS)))

  // Sound follows the animation: one strike per glyph, a bell when the caret becomes the dot
  const heard = useRef({ hash: false, typed: 0, dot: false, tag: 0 })
  useEffect(() => {
    if (reduced || leaving) return
    const h = heard.current
    if (showHash && !h.hash) { h.hash = true; keyStrike(0.7) }
    if (typed > h.typed) { h.typed = typed; keyStrike(1) }
    if (dot && !h.dot) { h.dot = true; bell() }
    if (tagChars - h.tag >= 3) { h.tag = tagChars; keyStrike(0.35) }
  }, [showHash, typed, dot, tagChars, leaving])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!leaving && (
        <motion.div
          key="splash"
          role="presentation"
          aria-label="Mdify"
          className="grain fixed inset-0 z-[100] grid cursor-default place-items-center bg-desk"
          exit={reduced ? { opacity: 0 } : { y: '-104%', rotate: -1.2, transition: { duration: 0.75, ease: [0.7, 0, 0.2, 1] } }}
          style={{ transformOrigin: 'top left', boxShadow: '0 30px 60px rgba(0,0,0,0.7)' }}
        >
          <div className="flex flex-col items-center">
            <div className="flex h-[96px] items-baseline">
              <AnimatePresence>
                {showHash && (
                  <motion.span
                    key="hash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -24, filter: 'blur(4px)', transition: { duration: 0.35 } }}
                    className="mr-3 font-mono text-[40px] text-faint"
                  >
                    #
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.span layout className="font-serif text-[80px] font-medium italic leading-none tracking-[-0.03em] text-ink">
                {WORD.slice(0, typed).split('').map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.span>
              {/* The caret: a typing bar that becomes the logo's dot */}
              <motion.span
                layout
                className="ml-2 inline-block bg-vermilion"
                initial={{ width: 4, height: 64, opacity: 1, y: 10 }}
                animate={
                  dot
                    ? { width: 12, height: 12, borderRadius: 999, opacity: 1, y: -6 }
                    : { width: 4, height: 64, borderRadius: 1, opacity: t > 250 && t < T_WORD ? [1, 1, 0, 0] : 1, y: 10 }
                }
                transition={
                  dot
                    ? { type: 'spring', stiffness: 420, damping: 18 }
                    : t < T_WORD
                      ? { opacity: { duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1] } }
                      : { duration: 0.1 }
                }
                style={{ alignSelf: dot ? 'baseline' : 'center' }}
              />
            </div>
            <motion.p
              className="mt-7 h-5 font-mono text-[13px] uppercase tracking-[0.28em] text-ink-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: stripped ? 1 : 0 }}
            >
              {TAGLINE.slice(0, tagChars)}
              {tagChars > 0 && tagChars < TAGLINE.length && <span className="ml-1 inline-block h-[13px] w-[7px] translate-y-[2px] bg-vermilion/80" />}
            </motion.p>
          </div>
          <p className="label absolute bottom-6 text-faint/70">Press any key to skip</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
