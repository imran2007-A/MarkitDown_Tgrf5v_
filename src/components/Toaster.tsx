import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

type Tone = 'ok' | 'err' | 'info'
interface Toast { id: number; message: string; tone: Tone }

const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {})
export const useToast = () => useContext(Ctx)

let nextId = 1

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((message: string, tone: Tone = 'ok') => {
    const id = nextId++
    setToasts((t) => [...t.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="sheet grain pointer-events-auto flex items-center gap-3 rounded-[2px] px-4 py-2.5 font-serif text-[15px] text-ink"
            >
              <span className={`label ${t.tone === 'err' ? 'text-vermilion' : 'text-pencil'}`}>{t.tone === 'err' ? 'Error' : t.tone === 'info' ? 'Note' : 'Done'}</span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
