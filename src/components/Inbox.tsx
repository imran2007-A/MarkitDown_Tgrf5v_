import { AnimatePresence, motion } from 'motion/react'
import { RotateCw, X } from 'lucide-react'
import type { Job } from '../lib/types'
import type { OutFile } from '../lib/export'
import { formatTokens } from '../lib/tokens'
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
  const folder = job.relPath.includes('/') ? job.relPath.slice(0, job.relPath.lastIndexOf('/')) : ''
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -14, rotate: -1.5 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: Math.min(index, 12) * 0.035 }}
      role="option"
      aria-selected={selected}
      tabIndex={done ? 0 : -1}
      onClick={() => done && onSelect()}
      onKeyDown={(e) => { if (done && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect() } }}
      className={cn('group relative grid grid-cols-[26px_1fr_auto] items-center gap-x-2 py-2.5 pl-4 pr-3', done ? 'cursor-pointer' : 'cursor-default')}
    >
      {selected && <motion.span layoutId="proof-mark" className="absolute inset-y-2 left-0 w-[2px] bg-vermilion" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
      <span className={cn('font-mono text-[10.5px] tabular-nums', selected ? 'text-vermilion' : 'text-faint')}>{pad(index + 1)}</span>
      <span className="min-w-0">
        <span className={cn('block truncate font-serif text-[15.5px] leading-tight transition-colors', selected ? 'text-ink' : done ? 'text-ink-2 group-hover:text-ink' : 'text-pencil', job.status === 'error' && 'line-through decoration-vermilion/70', job.status === 'skipped' && 'text-faint')}>
          {job.name}
        </span>
        <span className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-faint">
          <FileTag name={job.name} active={selected} />
          {job.status === 'converting' && <span className="truncate text-pencil">{job.progress ?? 'reading'}…</span>}
          {job.status === 'queued' && <span>queued</span>}
          {job.status === 'skipped' && <span>not supported</span>}
          {job.status === 'error' && <span className="truncate text-vermilion/90" title={job.error}>{job.error}</span>}
          {done && <span className="truncate">{folder ? `${folder}/` : job.engine === 'native' ? 'native engine' : ''}</span>}
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
  const counted = p.jobs.filter((j) => j.status !== 'skipped').length
  const done = p.jobs.filter((j) => j.status === 'done').length
  return (
    <aside className="flex min-h-0 flex-col border-r border-rule bg-desk lg:w-[320px] lg:flex-none" aria-label="Files">
      <header className="flex items-baseline justify-between px-4 pb-3 pt-5">
        <h2 className="label text-pencil">
          Inbox <span className="text-faint">·</span> <span className="tabular-nums text-ink-2">{pad(done)}</span>
          <span className="text-faint">/{pad(counted)}</span>
        </h2>
        <span className="font-mono text-[10.5px] text-pencil">
          <NumberTicker value={p.totalTokens} format={(n) => formatTokens(Math.round(n))} className="text-ink-2" /> tokens
        </span>
      </header>
      <div className="relative h-px bg-rule">
        <motion.div className="absolute inset-y-0 left-0 bg-vermilion" animate={{ width: `${p.progress * 100}%`, opacity: p.busy ? 1 : 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1 max-lg:max-h-[34vh]" role="listbox" aria-label="Converted files">
        <AnimatePresence initial={false}>
          {p.jobs.map((j, i) => (
            <Row
              key={j.id}
              job={j}
              index={i}
              selected={j.id === p.selectedId}
              onSelect={() => p.onSelect(j.id)}
              onRemove={() => p.onRemove(j.id)}
              onRetry={() => p.onRetry(j.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
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
