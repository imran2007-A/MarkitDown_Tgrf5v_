import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Cpu, Download, History, Keyboard, ShieldCheck, Sparkles, Trash2, FolderTree, Zap, FileText } from 'lucide-react'
import type { HistoryEntry, Job } from './lib/types'
import { extOf } from './lib/formats'
import { expandZips, fromDataTransfer, fromFileList, type Picked } from './lib/collect'
import { convertFile } from './lib/convert'
import { countTokens, formatTokens } from './lib/tokens'
import { addHistory } from './lib/history'
import { DropZone } from './components/DropZone'
import { JobList } from './components/JobList'
import { OutputPanel } from './components/OutputPanel'
import { ExportMenu } from './components/ExportMenu'
import { HistoryDrawer } from './components/HistoryDrawer'
import { useToast } from './components/Toaster'
import { Badge, Comet, GhostButton, IconButton } from './components/ui'
import { ShortcutsDialog } from './components/ShortcutsDialog'
import { BlurFade } from './components/magicui/BlurFade'
import { WordRotate } from './components/magicui/WordRotate'
import { ShinyText } from './components/magicui/ShinyText'
import { MagicCard } from './components/magicui/MagicCard'
import { NumberTicker } from './components/magicui/NumberTicker'
import { sampleFile } from './lib/sample'

const CONCURRENCY = 3
const uid = () => Math.random().toString(36).slice(2, 10)

type InstallEvent = Event & { prompt: () => Promise<void> }

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-8 rounded-[10px] shadow-lg shadow-violet/20" />
      <span className="text-[17px] font-semibold tracking-tight">Mdify</span>
    </div>
  )
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [nativeEngine, setNativeEngine] = useState(false)
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null)
  const running = useRef(new Set<string>())
  const sessionId = useRef(uid())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const jobsRef = useRef<Job[]>([])
  jobsRef.current = jobs

  useEffect(() => {
    window.mdify?.engineAvailable().then(setNativeEngine).catch(() => {})
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const patch = useCallback((id: string, p: Partial<Job>) => {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j)))
  }, [])

  const addPicked = useCallback(async (pickedRaw: Picked[]) => {
    const picked = await expandZips(pickedRaw)
    if (!picked.length) return
    const newJobs: Job[] = picked.map((p) => ({
      id: uid(),
      file: p.file,
      relPath: p.relPath,
      name: p.file.name,
      ext: extOf(p.file.name),
      size: p.file.size,
      status: p.supported ? 'queued' : 'skipped',
    }))
    setJobs((js) => {
      const seen = new Set(js.map((j) => `${j.relPath}:${j.size}`))
      return [...js, ...newJobs.filter((j) => !seen.has(`${j.relPath}:${j.size}`))]
    })
    const skipped = newJobs.filter((j) => j.status === 'skipped').length
    if (skipped) toast(`${skipped} unsupported ${skipped === 1 ? 'file' : 'files'} skipped`, 'info')
  }, [toast])

  // Worker pool: start queued jobs up to CONCURRENCY
  useEffect(() => {
    const queued = jobs.filter((j) => j.status === 'queued' && !running.current.has(j.id))
    const slots = CONCURRENCY - running.current.size
    for (const job of queued.slice(0, Math.max(0, slots))) {
      running.current.add(job.id)
      patch(job.id, { status: 'converting', progress: undefined })
      const started = performance.now()
      convertFile(job.file, (progress) => patch(job.id, { progress }))
        .then(async ({ markdown, engine }) => {
          const tokens = await countTokens(markdown)
          patch(job.id, { status: 'done', markdown, engine, tokens, ms: performance.now() - started })
          setSelectedId((cur) => cur ?? job.id)
        })
        .catch((e: unknown) => {
          console.error(job.relPath, e)
          patch(job.id, { status: 'error', error: e instanceof Error ? e.message : 'Conversion failed' })
        })
        .finally(() => running.current.delete(job.id))
    }
  }, [jobs, patch])

  const done = useMemo(() => jobs.filter((j) => j.status === 'done'), [jobs])
  const busy = jobs.some((j) => j.status === 'queued' || j.status === 'converting')
  const totalTokens = done.reduce((s, j) => s + (j.tokens ?? 0), 0)
  const convertible = jobs.filter((j) => j.status !== 'skipped').length
  const progress = convertible ? jobs.filter((j) => j.status === 'done' || j.status === 'error').length / convertible : 0
  const selected = jobs.find((j) => j.id === selectedId && j.status === 'done') ?? null
  const exportName = useMemo(() => {
    const roots = new Set(done.map((j) => j.relPath.split('/')[0]))
    if (done.length === 1) return done[0].name.replace(/\.[^.]+$/, '')
    return roots.size === 1 && done[0]?.relPath.includes('/') ? [...roots][0] : 'mdify-export'
  }, [done])

  // Persist the session to history whenever a batch finishes
  const wasBusy = useRef(false)
  useEffect(() => {
    if (wasBusy.current && !busy && done.length) {
      addHistory({
        id: sessionId.current,
        title: done.length === 1 ? done[0].name : `${exportName} (${done.length} files)`,
        createdAt: Date.now(),
        fileCount: done.length,
        tokens: totalTokens,
        files: done.map((j) => ({ relPath: j.relPath, markdown: j.markdown ?? '' })),
      }).catch(() => {})
      const failed = jobs.filter((j) => j.status === 'error').length
      toast(failed ? `Done · ${failed} failed` : `Converted ${done.length} ${done.length === 1 ? 'file' : 'files'}`, failed ? 'err' : 'ok')
    }
    wasBusy.current = busy
  }, [busy, done, exportName, jobs, toast, totalTokens])

  const onEdit = useCallback((id: string, markdown: string) => patch(id, { markdown }), [patch])

  const clearAll = () => {
    if (busy) return
    setJobs([])
    setSelectedId(null)
    sessionId.current = uid()
  }

  const restore = (h: HistoryEntry) => {
    sessionId.current = h.id
    const restored: Job[] = h.files.map((f) => {
      const name = f.relPath.split('/').pop()!
      return {
        id: uid(), file: new File([f.markdown], name), relPath: f.relPath, name, ext: extOf(name),
        size: f.markdown.length, status: 'done', markdown: f.markdown, tokens: undefined,
      }
    })
    setJobs(restored)
    setSelectedId(restored[0]?.id ?? null)
    Promise.all(restored.map(async (j) => patch(j.id, { tokens: await countTokens(j.markdown!) })))
  }

  // Keyboard shortcuts + paste
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, .cm-editor, [contenteditable]')
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        ;(e.shiftKey ? folderInputRef : fileInputRef).current?.click()
      } else if (mod && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setHistoryOpen(true)
      } else if (!typing && !mod && e.key === '?') {
        setShortcutsOpen(true)
      } else if (!typing && !mod && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const ids = jobsRef.current.filter((j) => j.status === 'done').map((j) => j.id)
        if (!ids.length) return
        e.preventDefault()
        setSelectedId((cur) => {
          const i = cur ? ids.indexOf(cur) : -1
          return ids[Math.max(0, Math.min(ids.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]
        })
      }
    }
    const onPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length && !(e.target as HTMLElement)?.closest?.('.cm-editor')) {
        addPicked(fromFileList(e.clipboardData.files))
      }
    }
    const blockNav = (e: DragEvent) => e.preventDefault()
    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    window.addEventListener('dragover', blockNav)
    window.addEventListener('drop', blockNav)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('dragover', blockNav)
      window.removeEventListener('drop', blockNav)
    }
  }, [addPicked])

  const dropProps = {
    onSample: () => addPicked([{ file: sampleFile(), relPath: 'os-unit-3-notes.html', supported: true }]),
    onFiles: (l: FileList) => addPicked(fromFileList(l)),
    onDrop: (dt: DataTransfer) => fromDataTransfer(dt).then(addPicked),
    fileInputRef,
    folderInputRef,
  }

  const hasJobs = jobs.length > 0

  return (
    <div className="flex min-h-full flex-col">
      <div className="app-bg" aria-hidden />

      <header className="titlebar sticky top-0 z-30 border-b border-line bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <button onClick={clearAll} aria-label="Mdify home" className="rounded-lg"><Logo /></button>
          <div className="ml-2 hidden sm:block">
            {nativeEngine ? (
              <Badge tone="violet"><Cpu size={11} /> Native engine</Badge>
            ) : (
              <Badge><ShieldCheck size={11} /> On-device · offline</Badge>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1">
            {installEvt && (
              <GhostButton className="h-8 text-xs" onClick={async () => { await installEvt.prompt(); setInstallEvt(null) }}>
                <Download size={13} /> Install app
              </GhostButton>
            )}
            <IconButton label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)} className="hidden sm:inline-flex"><Keyboard size={17} /></IconButton>
            <IconButton label="History" onClick={() => setHistoryOpen(true)}><History size={17} /></IconButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-8 sm:px-6">
        <AnimatePresence mode="wait">
          {!hasJobs ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="mx-auto flex max-w-3xl flex-col items-center pt-10 sm:pt-20"
            >
              <BlurFade>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet/25 bg-violet/[0.08] px-3 py-1 text-xs font-medium text-violet">
                  <Sparkles size={12} />
                  <ShinyText className="text-violet/80">Free · Offline · No sign-up</ShinyText>
                </span>
              </BlurFade>
              <BlurFade delay={0.08}>
                <h1 className="mt-6 text-center text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
                  <WordRotate className="text-gradient" words={['Anything in.', 'PDFs in.', 'Slides in.', 'Folders in.', 'Scans in.', 'Code in.']} />
                  <br />
                  <span className="text-fg">Markdown out.</span>
                </h1>
              </BlurFade>
              <BlurFade delay={0.16}>
                <p className="mx-auto mt-5 max-w-lg text-center text-[15px] leading-relaxed text-muted sm:text-base">
                  Drop a file or an entire folder. Get clean, structured Markdown for your notes, your docs, or any AI chat. It takes seconds and runs entirely on your device.
                </p>
              </BlurFade>
              <BlurFade delay={0.24} className="mt-10 w-full">
                <DropZone {...dropProps} />
              </BlurFade>
              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { Icon: ShieldCheck, title: 'Private by design', body: 'Files never leave your device. Works offline once installed.' },
                  { Icon: FolderTree, title: 'Whole folders', body: 'Keeps the structure and skips node_modules, .git and other junk.' },
                  { Icon: Zap, title: 'AI-ready output', body: 'Exact token counts and one-click Copy for AI.' },
                ].map(({ Icon, title, body }, i) => (
                  <BlurFade key={title} delay={0.32 + i * 0.06}>
                    <MagicCard className="h-full">
                      <div className="p-5">
                        <span className="grid size-9 place-items-center rounded-xl border border-line bg-linear-to-b from-violet/20 to-cyan/5">
                          <Icon size={16} className="text-violet" />
                        </span>
                        <p className="mt-4 text-sm font-medium">{title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                      </div>
                    </MagicCard>
                  </BlurFade>
                ))}
              </div>
              <footer className="mt-16 flex w-full flex-col items-center justify-between gap-2 border-t border-line pt-6 text-xs text-faint sm:flex-row">
                <span className="flex items-center gap-2"><FileText size={13} className="text-violet" /> Mdify v{__APP_VERSION__} · Built by Imran</span>
                <span>No accounts, no tracking, no uploads.</span>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key="work"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 pt-4 lg:h-[calc(100dvh-3.5rem-2rem)] lg:grid-cols-[minmax(320px,380px)_1fr]"
            >
              <aside className="flex min-h-0 flex-col gap-3">
                <DropZone compact {...dropProps} />
                <div className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <h2 className="text-sm font-medium">Files</h2>
                    <span className="text-xs text-faint">
                      {done.length}/{jobs.filter((j) => j.status !== 'skipped').length}
                    </span>
                    {busy && <Comet size={13} />}
                    <span className="ml-auto font-mono text-xs text-muted"><NumberTicker value={totalTokens} format={(n) => formatTokens(Math.round(n))} /> tok</span>
                    <IconButton label="Clear all" onClick={clearAll} disabled={busy} className="-mr-1.5"><Trash2 size={14} /></IconButton>
                  </div>
                  <div className="h-px w-full bg-line" aria-hidden>
                    <motion.div
                      className="h-px bg-linear-to-r from-violet to-cyan"
                      animate={{ width: `${progress * 100}%`, opacity: busy ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="max-h-[40vh] min-h-0 flex-1 overflow-y-auto p-2 lg:max-h-none">
                    <JobList
                      jobs={jobs}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={(id) => { setJobs((js) => js.filter((j) => j.id !== id)); if (id === selectedId) setSelectedId(null) }}
                      onRetry={(id) => patch(id, { status: 'queued', error: undefined })}
                    />
                  </div>
                  <div className="flex items-center justify-end border-t border-line p-3">
                    <ExportMenu files={done.map((j) => ({ relPath: j.relPath, markdown: j.markdown ?? '' }))} name={exportName} />
                  </div>
                </div>
              </aside>

              <div className="min-h-0">
                {selected ? (
                  <OutputPanel key={selected.id} job={selected} onEdit={onEdit} />
                ) : (
                  <div className="glass flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 rounded-3xl text-sm text-muted">
                    {busy ? (
                      <><Comet size={28} /><span className="shimmer-text">Converting your files…</span></>
                    ) : (
                      <>
                        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-white/[0.03]"><FileText size={20} className="text-faint" /></span>
                        <span>Select a converted file to preview it</span>
                        <span className="text-xs text-faint">Tip: use ↑ ↓ to move between files</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onRestore={restore} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
