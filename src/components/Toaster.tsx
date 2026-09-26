import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

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
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-24 lg:items-end lg:px-8" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="glass pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-raised px-4 py-2.5 text-sm shadow-2xl shadow-black/50"
            >
              {t.tone === 'ok' && <CheckCircle2 size={16} className="text-ok" />}
              {t.tone === 'err' && <AlertCircle size={16} className="text-err" />}
              {t.tone === 'info' && <Info size={16} className="text-violet" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
