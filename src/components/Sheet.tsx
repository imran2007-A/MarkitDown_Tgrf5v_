import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Job } from '../lib/types'
import { countTokens, CONTEXT_WINDOWS, formatTokens } from '../lib/tokens'
import { downloadText, mdPath } from '../lib/export'
import { cn, TextButton } from './ui'
import { PaperClip } from './DeskProps'
import { Marginalia } from './Marginalia'
import { OriginalView } from './OriginalView'
import { inkOf } from '../lib/ink'

const Editor = lazy(() => import('./Editor'))

export type Mode = 'read' | 'source' | 'compare'

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function Rendered({ markdown }: { markdown: string }) {
  const ref = useRef<HTMLElement>(null)
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(markdown, { async: false, gfm: true }) as string), [markdown])
  useLayoutEffect(() => {
    Array.from(ref.current?.children ?? []).forEach((el, i) => (el as HTMLElement).style.setProperty('--i', String(i)))
    ref.current?.querySelectorAll('h1, h2, h3').forEach((h, i) => h.setAttribute('data-h', String(i)))
  }, [html])
  return <article ref={ref} className="prose-paper ink-in" dangerouslySetInnerHTML={{ __html: html }} />
}

const turn: Variants = {
  enter: (dir: number) => (dir === 0 ? { opacity: 0, y: 48, rotateX: 12, scale: 0.96 } : { opacity: 0, x: dir * 90, rotateY: dir * -18, scale: 0.98 }),
  center: { opacity: 1, x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1 },
  exit: (dir: number) => (dir === 0 ? { opacity: 0, y: -24, scale: 0.98 } : { opacity: 0, x: dir * -70, rotateY: dir * 22, scale: 0.97 }),
}

interface Props {
  job: Job
  tabs: { id: string; name: string }[]
  onSelect: (id: string) => void
  dir: number
  mode: Mode
  onMode: (m: Mode) => void
  onEdit: (id: string, markdown: string) => void
  onStamp: (label: string) => void
}

export function Sheet({ job, tabs, onSelect, dir, mode, onMode, onEdit, onStamp }: Props) {
  const ink = inkOf(job.name)
  const markdown = job.markdown ?? ''
  const debounced = useDebounced(markdown, 220)
  const [tokens, setTokens] = useState(job.tokens ?? 0)
  const words = useMemo(() => (debounced.match(/\S+/g) ?? []).length, [debounced])

  useEffect(() => {
    let alive = true
    countTokens(debounced).then((n) => alive && setTokens(n))
    return () => { alive = false }
  }, [debounced])

  const copy = async () => {
    await navigator.clipboard.writeText(`<document path="${job.relPath}">\n${markdown}\n</document>`)
    onStamp('Copied')
  }
  const download = () => {
    downloadText(markdown, mdPath(job.name))
    onStamp('Saved')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, .cm-editor, [contenteditable]')
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); download() }
      else if (e.key === 'Tab' && !typing && !mod) { e.preventDefault(); const order: Mode[] = ['read', 'source', 'compare']; onMode(order[(order.indexOf(mode) + (e.shiftKey ? 2 : 1)) % 3]) }
      else if (e.key === 'Escape' && mode === 'source') onMode('read')
      else if (!typing && !mod && !e.altKey && e.key.toLowerCase() === 'c') copy()
      else if (!typing && !mod && !e.altKey && e.key.toLowerCase() === 'd') download()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const fits = CONTEXT_WINDOWS.map((c) => ({ ...c, ok: tokens <= c.tokens }))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="titlebar-sub flex items-center gap-5 border-b border-rule px-5 py-2.5 lg:px-8">
        <p className="label flex min-w-0 items-center gap-2 truncate text-pencil" title={job.relPath}>
          <span className="size-2 flex-none rounded-full" style={{ background: ink.color }} />
          <span className="truncate text-ink-2">{job.name}</span> <span className="text-faint">→</span> <span className="truncate">{mdPath(job.name)}</span>
        </p>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-3" role="tablist" aria-label="View">
            {(['read', 'source', 'compare'] as const).map((m) => (
              <TextButton key={m} role="tab" aria-selected={mode === m} active={mode === m} onClick={() => onMode(m)} className={cn('relative', mode === m && 'text-ink')}>
                <span className={m === 'compare' ? 'max-sm:hidden' : ''}>{m === 'read' ? 'Read' : m === 'source' ? 'Source' : 'Compare'}</span>
                {mode === m && <motion.span layoutId="mode-underline" className="absolute inset-x-0 -bottom-[11px] h-[2px]" style={{ background: ink.color }} />}
              </TextButton>
            ))}
            <span className="label hidden text-faint sm:inline pointer-coarse:hidden">tab</span>
          </div>
          <span className="h-4 w-px bg-rule" />
          <TextButton onClick={copy} title="Copy wrapped for AI (C)">Copy <span className="text-faint pointer-coarse:hidden">c</span></TextButton>
          <TextButton onClick={download} title="Download .md (D)" className="max-sm:hidden">Save <span className="text-faint">d</span></TextButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [perspective:1800px]" id="sheet-scroll">
        {mode === 'compare' ? (
          <motion.div key={job.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 24 }} className="mx-auto grid max-w-[1500px] gap-8 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:py-10">
            <section aria-label="Original">
              <h3 className="label mb-3 flex items-center gap-2 text-pencil"><span className="size-2 rounded-full" style={{ background: ink.color }} /> Original · {ink.label}</h3>
              <OriginalView job={job} />
            </section>
            <section aria-label="Markdown">
              <h3 className="label mb-3 text-pencil">Markdown</h3>
              <div className="sheet grain rounded-[2px] px-7 py-10 sm:px-12">
                <Rendered markdown={markdown} />
              </div>
            </section>
          </motion.div>
        ) : (
          <div className="mx-auto flex max-w-[1240px] justify-center gap-14 px-3 py-6 sm:px-10 lg:py-12">
            <div className="relative w-full max-w-[780px]">
              <div aria-hidden className="sheet absolute inset-x-2 bottom-[-10px] top-3 rounded-[2px] opacity-70" style={{ transform: 'rotate(1.4deg)' }} />
              <div aria-hidden className="sheet absolute inset-x-1 bottom-[-5px] top-1.5 rounded-[2px] opacity-85" style={{ transform: 'rotate(-0.7deg)' }} />
              {tabs.length > 1 && (
                <nav className="absolute -right-[30px] top-16 z-0 flex flex-col gap-1.5 max-sm:hidden" aria-label="Pages">
                  {tabs.slice(0, 12).map((t, i) => {
                    const tInk = inkOf(t.name)
                    const on = t.id === job.id
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        title={t.name}
                        initial={false}
                        animate={{ x: on ? 6 : 0 }}
                        whileHover={{ x: on ? 6 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="relative flex h-[42px] w-[30px] items-center justify-center rounded-r-[4px] border border-l-0 font-mono text-[9.5px] tabular-nums shadow-[3px_4px_8px_-4px_rgba(0,0,0,0.7)]"
                        style={{ background: on ? tInk.color : `color-mix(in oklab, ${tInk.color} 22%, #1f1e1b)`, borderColor: `color-mix(in oklab, ${tInk.color} 45%, transparent)`, color: on ? '#141311' : tInk.color }}
                      >
                        <span className="[writing-mode:vertical-rl]">{String(i + 1).padStart(2, '0')}</span>
                      </motion.button>
                    )
                  })}
                  {tabs.length > 12 && <span className="label pl-1 text-faint">+{tabs.length - 12}</span>}
                </nav>
              )}
              <AnimatePresence mode="popLayout" custom={dir} initial={true}>
                <motion.div
                  key={job.id + mode}
                  custom={dir}
                  variants={turn}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 170, damping: 24, mass: 0.9 }}
                  style={{ transformOrigin: dir > 0 ? 'left center' : dir < 0 ? 'right center' : 'top center' }}
                  className="relative z-10"
                >
                  <PaperClip className="absolute -top-5 left-10 z-20 h-[72px] w-[26px] rotate-[4deg]" />
                  <div className="sheet grain w-full rounded-[2px]" style={{ boxShadow: `inset 3px 0 0 0 ${ink.color}` }}>
                    {mode === 'read' ? (
                      <div className="px-6 pb-14 pt-14 sm:px-14 lg:px-20 lg:pt-16">
                        <Rendered markdown={markdown} />
                        <footer className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-5 font-mono text-[10.5px] text-pencil">
                          <span><span className="text-ink-2 tabular-nums">{tokens.toLocaleString()}</span> tokens</span>
                          <span><span className="text-ink-2 tabular-nums">{words.toLocaleString()}</span> words</span>
                          <span className="ml-auto flex flex-wrap gap-x-3">
                            {fits.map((f) => (
                              <span key={f.name} title={`${f.name}: ${formatTokens(f.tokens)} context`} className={f.ok ? 'text-sage' : 'text-vermilion line-through'}>
                                {f.name.split(' ')[0]}
                              </span>
                            ))}
                          </span>
                        </footer>
                      </div>
                    ) : (
                      <div className="min-h-[70vh] py-10 sm:px-6">
                        <Suspense fallback={<p className="label p-8 text-faint">Opening source…</p>}>
                          <Editor value={markdown} onChange={(v) => onEdit(job.id, v)} />
                        </Suspense>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <Marginalia job={job} tokens={tokens} words={words} />
          </div>
        )}
      </div>
    </div>
  )
}
