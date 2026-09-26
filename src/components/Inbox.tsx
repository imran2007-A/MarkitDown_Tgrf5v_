import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RotateCw, X } from 'lucide-react'
import type { Job } from '../lib/types'
import type { OutFile } from '../lib/export'
import { formatTokens } from '../lib/tokens'
import { formatBytes } from '../lib/formats'
import { inkOf, INKS } from '../lib/ink'
import { cn, FileTag, IconButton, TextButton } from './ui'
import { NumberTicker } from './magicui/NumberTicker'
import { ExportMenu } from './ExportMenu'

interface Props {
  jobs: Job[]
  selectedId: string | null
  busy: boolean
  progress: number
  totalTokens: number
  exportFiles: OutFile[]
  exportName: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  onAddFiles: () => void
  onAddFolder: () => void
  onClear: () => void
  onExported: (label: string) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

function Row({ job, index, selected, onSelect, onRemove, onRetry }: { job: Job; index: number; selected: boolean; onSelect: () => void; onRemove: () => void; onRetry: () => void }) {
  const done = job.status === 'done'
  const ink = inkOf(job.name)
  const outSize = job.markdown ? new Blob([job.markdown]).size : 0
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -14, rotate: -1.5 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: Math.min(index, 12) * 0.03 }}
      role="option"
      aria-selected={selected}
      tabIndex={done ? 0 : -1}
      onClick={() => done && onSelect()}
      onKeyDown={(e) => { if (done && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect() } }}
      className={cn(
        'group relative grid grid-cols-[26px_1fr_auto] items-center gap-x-2 py-2.5 pl-4 pr-3 transition-colors',
        done ? 'cursor-pointer hover:bg-paper/60' : 'cursor-default',
        selected && 'bg-paper',
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[3px] transition-opacity" style={{ background: ink.color, opacity: selected ? 1 : done ? 0.35 : 0.15 }} />
      <span className="font-mono text-[10.5px] tabular-nums" style={{ color: selected ? ink.color : undefined }}>
        <span className={selected ? '' : 'text-faint'}>{pad(index + 1)}</span>
      </span>
      <span className="min-w-0">
        <span className={cn('block truncate font-serif text-[15.5px] leading-tight transition-colors', selected ? 'text-ink' : done ? 'text-ink-2 group-hover:text-ink' : 'text-pencil', job.status === 'error' && 'line-through decoration-vermilion/70', job.status === 'skipped' && 'text-faint')}>
          {job.name}
        </span>
        <span className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-faint">
          <FileTag name={job.name} active={selected} />
          {job.status === 'converting' && <span className="truncate text-pencil">{job.progress ?? 'reading'}…</span>}
          {job.status === 'queued' && <span>waiting</span>}
          {job.status === 'skipped' && <span>not supported</span>}
          {job.status === 'error' && <span className="truncate text-vermilion/90" title={job.error}>{job.error}</span>}
          {done && (
            <span className="truncate">
              {job.restored ? 'from archive' : <>{formatBytes(job.size)} → {formatBytes(outSize)}</>}
              {job.ms != null && <span className="text-faint/80"> · {job.ms < 1000 ? `${Math.round(job.ms)}ms` : `${(job.ms / 1000).toFixed(1)}s`}</span>}
            </span>
          )}
        </span>
        {job.status === 'converting' && <span className="pen-line mt-2 block" />}
      </span>
      <span className="flex items-center gap-1">
        {done && <span className="font-mono text-[10.5px] tabular-nums text-pencil group-hover:hidden">{formatTokens(job.tokens ?? 0)}</span>}
        {job.status === 'error' && (
          <IconButton label="Retry" className="size-6" onClick={(e) => { e.stopPropagation(); onRetry() }}><RotateCw size={12} /></IconButton>
        )}
        {job.status !== 'converting' && (
          <IconButton label={`Remove ${job.name}`} className="hidden size-6 group-hover:inline-grid group-focus-within:inline-grid" onClick={(e) => { e.stopPropagation(); onRemove() }}>
            <X size={13} />
          </IconButton>
        )}
      </span>
    </motion.li>
  )
}

export function Inbox(p: Props) {
  const [filter, setFilter] = useState<string | null>(null)
  const counted = p.jobs.filter((j) => j.status !== 'skipped').length
  const done = p.jobs.filter((j) => j.status === 'done').length

  const kinds = useMemo(() => {
    const m = new Map<string, number>()
    for (const j of p.jobs) { const k = inkOf(j.name).kind; m.set(k, (m.get(k) ?? 0) + 1) }
    return [...m.entries()]
  }, [p.jobs])

  const groups = useMemo(() => {
    const visible = p.jobs.map((j, i) => ({ j, i })).filter(({ j }) => !filter || inkOf(j.name).kind === filter)
    const map = new Map<string, { j: Job; i: number }[]>()
    for (const v of visible) {
      const dir = v.j.relPath.includes('/') ? v.j.relPath.slice(0, v.j.relPath.lastIndexOf('/')) : ''
      if (!map.has(dir)) map.set(dir, [])
      map.get(dir)!.push(v)
    }
    return [...map.entries()]
  }, [p.jobs, filter])

  return (
    <aside className="flex min-h-0 flex-col border-r border-rule bg-desk lg:w-[340px] lg:flex-none" aria-label="Files">
      <header className="px-4 pb-3 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="label text-pencil">
            Inbox <span className="text-faint">·</span> <span className="tabular-nums text-ink-2">{pad(done)}</span>
            <span className="text-faint">/{pad(counted)}</span>
          </h2>
          <span className="font-mono text-[10.5px] text-pencil">
            <NumberTicker value={p.totalTokens} format={(n) => formatTokens(Math.round(n))} className="text-ink-2" /> tokens
          </span>
        </div>
        {kinds.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
            {kinds.map(([k, n]) => {
              const ink = INKS[k as keyof typeof INKS]
              const on = filter === k
              return (
                <button
                  key={k}
                  onClick={() => setFilter(on ? null : k)}
                  aria-pressed={on}
                  className="rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] transition-colors"
                  style={{ color: on ? '#141311' : ink.color, background: on ? ink.color : 'transparent', borderColor: `color-mix(in oklab, ${ink.color} 45%, transparent)` }}
                >
                  {ink.label} {n}
                </button>
              )
            })}
          </div>
        )}
      </header>
      <div className="relative h-px bg-rule">
        <motion.div className="absolute inset-y-0 left-0 bg-vermilion" animate={{ width: `${p.progress * 100}%`, opacity: p.busy ? 1 : 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1 max-lg:max-h-[34vh]">
        {groups.map(([dir, items]) => (
          <section key={dir || '_root'}>
            {dir && (
              <h3 className="label sticky top-0 z-10 flex items-center gap-2 bg-desk/95 px-4 pb-1.5 pt-3 text-faint backdrop-blur-sm">
                <span className="text-pencil">▾</span> <span className="truncate normal-case tracking-normal">{dir}/</span>
                <span className="ml-auto">{items.length}</span>
              </h3>
            )}
            <ul role="listbox" aria-label={dir || 'Files'}>
              <AnimatePresence initial={false}>
                {items.map(({ j, i }) => (
                  <Row key={j.id} job={j} index={i} selected={j.id === p.selectedId} onSelect={() => p.onSelect(j.id)} onRemove={() => p.onRemove(j.id)} onRetry={() => p.onRetry(j.id)} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ))}
      </div>
      <footer className="space-y-3 border-t border-rule px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <TextButton onClick={p.onAddFiles}>+ Files</TextButton>
          <TextButton onClick={p.onAddFolder}>+ Folder</TextButton>
          <TextButton onClick={p.onClear} disabled={p.busy} className="ml-auto hover:text-vermilion">Clear</TextButton>
        </div>
        <ExportMenu files={p.exportFiles} name={p.exportName} onDone={p.onExported} />
      </footer>
    </aside>
  )
}
