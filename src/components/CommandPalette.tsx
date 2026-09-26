import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Job } from '../lib/types'
import { inkOf } from '../lib/ink'
import { cn, Kbd } from './ui'

export interface Command {
  id: string
  label: string
  hint?: string
  run: () => void
}

interface Result {
  key: string
  group: 'Pages' | 'In the text' | 'Commands'
  title: ReactNode
  sub?: ReactNode
  color?: string
  run: () => void
}

function snippet(text: string, q: string): ReactNode | null {
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return null
  const start = Math.max(0, i - 40)
  const pre = (start > 0 ? '…' : '') + text.slice(start, i).replace(/[#*_`>|]/g, '')
  const hit = text.slice(i, i + q.length)
  const post = text.slice(i + q.length, i + q.length + 70).replace(/[#*_`>|]/g, '') + '…'
  return <>{pre}<mark className="rounded-[2px] bg-vermilion/25 px-0.5 text-ink">{hit}</mark>{post}</>
}

export function CommandPalette({ open, onClose, jobs, commands, onOpenJob }: { open: boolean; onClose: () => void; jobs: Job[]; commands: Command[]; onOpenJob: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => input.current?.focus(), 30) } }, [open])

  const results = useMemo<Result[]>(() => {
    const query = q.trim()
    const done = jobs.filter((j) => j.status === 'done')
    const lower = query.toLowerCase()
    const pages: Result[] = done
      .filter((j) => !query || j.relPath.toLowerCase().includes(lower))
      .slice(0, 6)
      .map((j) => ({ key: 'p' + j.id, group: 'Pages', title: j.name, sub: j.relPath !== j.name ? j.relPath : undefined, color: inkOf(j.name).color, run: () => onOpenJob(j.id) }))
    const text: Result[] = query.length >= 2
      ? done.flatMap((j) => {
          const sn = snippet(j.markdown ?? '', query)
          return sn ? [{ key: 't' + j.id, group: 'In the text' as const, title: j.name, sub: sn, color: inkOf(j.name).color, run: () => onOpenJob(j.id) }] : []
        }).slice(0, 8)
      : []
    const cmds: Result[] = commands
      .filter((c) => !query || c.label.toLowerCase().includes(lower))
      .map((c) => ({ key: 'c' + c.id, group: 'Commands', title: c.label, sub: c.hint, run: c.run }))
    return [...pages, ...text, ...cmds]
  }, [q, jobs, commands, onOpenJob])

  useEffect(() => setActive(0), [q])

  const choose = (r?: Result) => { if (!r) return; onClose(); setTimeout(r.run, 60) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]) }
    else if (e.key === 'Escape') onClose()
  }

  useEffect(() => { document.querySelector(`[data-cmd="${active}"]`)?.scrollIntoView({ block: 'nearest' }) }, [active])

  let lastGroup = ''
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-desk/75 px-4 pt-[12vh] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            role="dialog"
            aria-label="Search and commands"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ y: -30, rotate: 0.8, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="sheet grain w-full max-w-[640px] overflow-hidden rounded-[3px]"
          >
            <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
              <span className="label text-vermilion">Find</span>
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="a page, a phrase, or a command…"
                className="min-w-0 flex-1 bg-transparent font-serif text-[21px] italic text-ink placeholder:text-faint focus:outline-none"
                aria-label="Search"
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto py-2" role="listbox">
              {results.length === 0 && <li className="px-5 py-8 font-serif text-[16px] italic text-pencil">Nothing on the desk matches “{q}”.</li>}
              {results.map((r, i) => {
                const header = r.group !== lastGroup ? r.group : null
                lastGroup = r.group
                return (
                  <li key={r.key}>
                    {header && <p className="label px-5 pb-1 pt-3 text-faint">{header}</p>}
                    <button
                      data-cmd={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(r)}
                      className={cn('relative flex w-full items-baseline gap-3 px-5 py-2 text-left', i === active && 'bg-paper-2')}
                    >
                      {i === active && <span className="absolute inset-y-1.5 left-0 w-[2px] bg-vermilion" />}
                      {r.color ? <span className="size-2 flex-none translate-y-[-1px] rounded-full" style={{ background: r.color }} /> : <span className="label w-2 flex-none text-faint">›</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[16.5px] text-ink">{r.title}</span>
                        {r.sub && <span className="mt-0.5 block truncate font-mono text-[11px] text-pencil">{r.sub}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-4 border-t border-rule px-5 py-2.5 font-mono text-[10.5px] text-faint">
              <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> move</span>
              <span><Kbd>↵</Kbd> open</span>
              <span className="ml-auto">searches inside every converted page</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
