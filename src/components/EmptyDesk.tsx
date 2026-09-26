import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { HistoryEntry } from '../lib/types'
import { listHistory } from '../lib/history'
import { readLedger } from '../lib/stats'
import { formatTokens } from '../lib/tokens'
import { formatBytes } from '../lib/formats'
import { INKS } from '../lib/ink'
import { Kbd } from './ui'
import { DeskObjects, PaperClip } from './DeskProps'
import { NumberTicker } from './magicui/NumberTicker'

interface Props {
  onFiles: () => void
  onFolder: () => void
  onSample: () => void
  onRestore: (h: HistoryEntry) => void
}

const RULED = 'repeating-linear-gradient(to bottom, transparent 0 31px, rgb(255 245 230 / 0.035) 31px 32px)'
const SHELF: (keyof typeof INKS)[] = ['pdf', 'docx', 'pptx', 'sheet', 'html', 'image', 'data', 'code', 'archive', ...(typeof window !== 'undefined' && window.mdify ? (['native'] as const) : [])]
const SHELF_EXT: Record<string, string> = { pdf: '.pdf', docx: '.docx', pptx: '.pptx', sheet: '.xlsx .csv', html: '.html', image: '.png .jpg', data: '.json .ipynb', code: '60+ langs', archive: '.zip', native: '.epub .msg' }

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Pinned({ items, onRestore }: { items: HistoryEntry[]; onRestore: (h: HistoryEntry) => void }) {
  const rot = [-3, 2.2, -1.4, 2.8]
  return (
    <section className="space-y-5" aria-label="Recent pages">
      <h2 className="label flex items-center gap-2 text-pencil"><span className="h-px w-4 bg-vermilion" /> Pinned · recent</h2>
      {items.length === 0 ? (
        <div className="sheet relative rounded-[2px] border border-dashed border-rule-2 bg-transparent p-5 opacity-70 [box-shadow:none]">
          <p className="font-serif text-[15px] italic leading-snug text-pencil">Your last few conversions get pinned here, ready to reopen.</p>
        </div>
      ) : (
        items.slice(0, 4).map((h, i) => (
          <motion.button
            key={h.id}
            onClick={() => onRestore(h)}
            initial={{ opacity: 0, x: -40, rotate: rot[i] - 6 }}
            animate={{ opacity: 1, x: 0, rotate: rot[i] }}
            whileHover={{ rotate: 0, y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.15 + i * 0.07 }}
            className="sheet grain relative block w-full rounded-[2px] px-5 pb-4 pt-6 text-left"
          >
            <PaperClip className="absolute -top-4 right-6 h-[52px] w-[19px] rotate-[-6deg]" />
            <p className="truncate font-serif text-[17px] text-ink">{h.title}</p>
            <p className="mt-1 font-mono text-[10.5px] text-faint">{timeAgo(h.createdAt)} · {h.fileCount} {h.fileCount === 1 ? 'page' : 'pages'} · {formatTokens(h.tokens)} tok</p>
          </motion.button>
        ))
      )}
    </section>
  )
}

function Ledger() {
  const l = readLedger()
  const rows = [
    { label: 'Files converted', value: l.files, fmt: (n: number) => Math.round(n).toLocaleString() },
    { label: 'Tokens written', value: l.tokens, fmt: (n: number) => formatTokens(Math.round(n)) },
    { label: 'Weight shed', value: Math.max(0, l.bytesIn - l.bytesOut), fmt: (n: number) => formatBytes(Math.round(n)) },
  ]
  return (
    <motion.section
      aria-label="Ledger"
      initial={{ opacity: 0, x: 40, rotate: 5 }}
      animate={{ opacity: 1, x: 0, rotate: 1.6 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.25 }}
      className="sheet grain rounded-[2px] px-6 pb-6 pt-5"
    >
      <p className="label flex justify-between text-pencil"><span>Ledger</span><span className="text-faint">since {new Date(l.since).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span></p>
      <dl className="mt-4 divide-y divide-rule">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between py-2.5">
            <dt className="font-mono text-[10.5px] text-faint">{r.label}</dt>
            <dd className="font-serif text-[26px] leading-none tabular-nums text-ink"><NumberTicker value={r.value} from={0} format={r.fmt} /></dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-rule pt-3 font-mono text-[10.5px] leading-relaxed text-faint">Kept on this device. Nothing is uploaded, ever.</p>
    </motion.section>
  )
}

function Shelf({ onPick }: { onPick: () => void }) {
  return (
    <section aria-label="Formats" className="w-full">
      <div className="flex items-end justify-center gap-1 overflow-x-auto px-2 pb-px">
        {SHELF.map((k, i) => {
          const ink = INKS[k]
          return (
            <motion.button
              key={k}
              onClick={onPick}
              title={`Open ${ink.label} files`}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.35 + i * 0.035 }}
              className="group relative flex h-[64px] min-w-[92px] flex-col justify-between rounded-t-[6px] border border-b-0 px-3 pb-3 pt-2 text-left"
              style={{ background: `color-mix(in oklab, ${ink.color} 16%, #191816)`, borderColor: `color-mix(in oklab, ${ink.color} 40%, transparent)` }}
            >
              <span className="label" style={{ color: ink.color }}>{ink.label}</span>
              <span className="font-mono text-[10px] text-pencil">{SHELF_EXT[k]}</span>
            </motion.button>
          )
        })}
      </div>
      <div className="h-[6px] rounded-[1px] bg-[#2a2622] shadow-[0_6px_14px_-4px_rgba(0,0,0,0.8)]" />
    </section>
  )
}

export function EmptyDesk({ onFiles, onFolder, onSample, onRestore }: Props) {
  const [recent, setRecent] = useState<HistoryEntry[]>([])
  useEffect(() => { listHistory().then(setRecent).catch(() => {}) }, [])

  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden">
      <DeskObjects />
      <div className="relative mx-auto flex min-h-full max-w-[1320px] flex-col gap-12 px-5 pb-10 pt-10 xl:pt-14">
        <div className="grid flex-1 items-center gap-10 xl:grid-cols-[250px_1fr_280px]">
          <div className="order-3 xl:order-1"><Pinned items={recent} onRestore={onRestore} /></div>

          <div className="relative order-1 mx-auto w-full max-w-[560px] xl:order-2">
            <motion.div
              aria-hidden
              className="sheet absolute inset-0 rounded-[2px]"
              initial={{ rotate: 0, y: 30, opacity: 0 }}
              animate={{ rotate: 3.2, y: 6, opacity: 0.55 }}
              transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.1 }}
            />
            <motion.div
              initial={{ rotate: -5, y: 60, opacity: 0 }}
              animate={{ rotate: -1.1, y: 0, opacity: 1 }}
              whileHover={{ rotate: -0.4, y: -4 }}
              transition={{ type: 'spring', stiffness: 120, damping: 17 }}
              className="sheet grain relative rounded-[2px] px-8 pb-10 pt-9 sm:px-12"
              style={{ backgroundImage: RULED, boxShadow: 'inset 3px 0 0 0 var(--color-vermilion)' }}
            >
              <PaperClip className="absolute -top-5 left-[44%] h-[72px] w-[26px] rotate-[3deg]" />
              <p className="label flex justify-between text-faint">
                <span>No. {String(recent.length + 1).padStart(2, '0')}</span>
                <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </p>
              <h1 className="mt-12 font-serif text-[34px] font-[420] italic leading-[1.08] tracking-[-0.02em] text-ink sm:mt-14 sm:text-[46px]">
                <span className="pointer-coarse:hidden">Drop</span><span className="hidden pointer-coarse:inline">Open</span> a file, a folder,
                <br />
                or a whole zip.
              </h1>
              <div className="mt-12 space-y-3 font-serif text-[18px] text-ink-2">
                <button onClick={onFiles} className="group flex w-full items-center justify-between">
                  <span className="link-ink">Choose files</span>
                  <span className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100 pointer-coarse:hidden"><Kbd>Ctrl</Kbd><Kbd>O</Kbd></span>
                </button>
                <button onClick={onFolder} className="group flex w-full items-center justify-between">
                  <span className="link-ink">Choose a folder</span>
                  <span className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100 pointer-coarse:hidden"><Kbd>Ctrl</Kbd><Kbd>⇧</Kbd><Kbd>O</Kbd></span>
                </button>
                <button onClick={onSample} className="group flex w-full items-center justify-between">
                  <span className="link-ink italic text-pencil group-hover:text-ink">or try a sample page</span>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="order-2 mx-auto w-full max-w-[560px] xl:order-3 xl:max-w-none"><Ledger /></div>
        </div>
        <Shelf onPick={onFiles} />
      </div>
    </div>
  )
}
