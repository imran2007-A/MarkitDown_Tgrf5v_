import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { HistoryEntry, Job } from './lib/types'
import { extOf } from './lib/formats'
import { expandZips, fromDataTransfer, fromFileList, type Picked } from './lib/collect'
import { convertFile } from './lib/convert'
import { countTokens } from './lib/tokens'
import { addHistory } from './lib/history'
import { sampleFile } from './lib/sample'
import { Inbox } from './components/Inbox'
import { Sheet, type Mode } from './components/Sheet'
import { EmptyDesk } from './components/EmptyDesk'
import { DragVeil } from './components/DragVeil'
import { Stamp } from './components/Stamp'
import { HistoryDrawer } from './components/HistoryDrawer'
import { ShortcutsDialog } from './components/ShortcutsDialog'
import { useToast } from './components/Toaster'
import { Kbd, TextButton } from './components/ui'
import { CommandPalette, type Command } from './components/CommandPalette'
import { addToLedger } from './lib/stats'
import { setSoundOn, soundOn } from './lib/typewriter'
import { canPickDirectory, mergeWithToc, saveText, saveToFolder, saveZip, type SaveReceipt } from './lib/export'
import { Receipt } from './components/Receipt'
import { WindowControls } from './components/WindowControls'

const CONCURRENCY = 3
const uid = () => Math.random().toString(36).slice(2, 10)

type InstallEvent = Event & { prompt: () => Promise<void> }

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dir, setDir] = useState(0)
  const [mode, setMode] = useState<Mode>('read')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const ledgered = useRef(new Set<string>())
  const [nativeEngine, setNativeEngine] = useState(false)
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null)
  const [drag, setDrag] = useState({ active: false, count: 0 })
  const [stamp, setStamp] = useState<{ id: number; label: string } | null>(null)
  const [receipt, setReceipt] = useState<(SaveReceipt & { verb: string }) | null>(null)
  const running = useRef(new Set<string>())
  const sessionId = useRef(uid())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const jobsRef = useRef<Job[]>([])
  jobsRef.current = jobs
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selectedId

  useEffect(() => {
    window.mdify?.engineAvailable().then(setNativeEngine).catch(() => {})
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const select = useCallback((id: string) => {
    const done = jobsRef.current.filter((j) => j.status === 'done').map((j) => j.id)
    const from = selectedRef.current ? done.indexOf(selectedRef.current) : -1
    const to = done.indexOf(id)
    if (id === selectedRef.current) return
    setDir(from < 0 ? 0 : to > from ? 1 : -1)
    setSelectedId(id)
  }, [])

  const stampTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const doStamp = useCallback((label: string) => {
    clearTimeout(stampTimer.current)
    setStamp({ id: Date.now(), label })
    stampTimer.current = setTimeout(() => setStamp(null), 1300)
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
          setSelectedId((cur) => { if (!cur) setDir(0); return cur ?? job.id })
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
      const fresh = done.filter((j) => !j.restored && !ledgered.current.has(j.id))
      fresh.forEach((j) => ledgered.current.add(j.id))
      if (fresh.length) {
        addToLedger({
          files: fresh.length,
          tokens: fresh.reduce((n, j) => n + (j.tokens ?? 0), 0),
          bytesIn: fresh.reduce((n, j) => n + j.size, 0),
          bytesOut: fresh.reduce((n, j) => n + new Blob([j.markdown ?? '']).size, 0),
        })
      }
      const failed = jobs.filter((j) => j.status === 'error').length
      if (failed) toast(`${failed} ${failed === 1 ? 'file' : 'files'} could not be read`, 'err')
    }
    wasBusy.current = busy
  }, [busy, done, exportName, jobs, toast, totalTokens])

  const onEdit = useCallback((id: string, markdown: string) => patch(id, { markdown }), [patch])

  const clearAll = () => {
    if (busy) return
    setJobs([])
    setSelectedId(null)
    setMode('read')
    setDir(0)
    sessionId.current = uid()
  }

  const restore = (h: HistoryEntry) => {
    sessionId.current = h.id
    const restored: Job[] = h.files.map((f) => {
      const name = f.relPath.split('/').pop()!
      return {
        id: uid(), file: new File([f.markdown], name), relPath: f.relPath, name, ext: extOf(name),
        size: f.markdown.length, status: 'done', markdown: f.markdown, tokens: undefined, restored: true,
      }
    })
    setJobs(restored)
    setDir(0)
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
      } else if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (mod && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setHistoryOpen(true)
      } else if (!typing && !mod && e.key === '?') {
        setShortcutsOpen(true)
      } else if (!typing && !mod && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const ids = jobsRef.current.filter((j) => j.status === 'done').map((j) => j.id)
        if (!ids.length) return
        e.preventDefault()
        const cur = selectedRef.current
        const i = cur ? ids.indexOf(cur) : -1
        select(ids[Math.max(0, Math.min(ids.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))])
      }
    }
    const onPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length && !(e.target as HTMLElement)?.closest?.('.cm-editor')) {
        addPicked(fromFileList(e.clipboardData.files))
      }
    }
    let depth = 0
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth++
      setDrag({ active: true, count: e.dataTransfer?.items.length ?? 0 })
    }
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      if (--depth <= 0) { depth = 0; setDrag({ active: false, count: 0 }) }
    }
    const onOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDrag({ active: false, count: 0 })
      if (e.dataTransfer) fromDataTransfer(e.dataTransfer).then(addPicked)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [addPicked])

  const guard = (fn: () => Promise<void>) => () => { fn().catch((e) => toast(`Couldn't save: ${e instanceof Error ? e.message : 'unknown error'}`, 'err')) }
  const onSaved = (r: SaveReceipt, verb: string) => {
    doStamp(verb)
    setTimeout(() => setReceipt({ ...r, verb }), 450)
  }
  const pickFiles = () => fileInputRef.current?.click()
  const pickFolder = () => folderInputRef.current?.click()
  const loadSample = () => addPicked([{ file: sampleFile(), relPath: 'os-unit-3-notes.html', supported: true }])
  const hasJobs = jobs.length > 0
  const outFiles = done.map((j) => ({ relPath: j.relPath, markdown: j.markdown ?? '' }))
  const commands: Command[] = [
    { id: 'files', label: 'Add files…', hint: 'Ctrl O', run: pickFiles },
    { id: 'folder', label: 'Add a folder…', hint: 'Ctrl Shift O', run: pickFolder },
    { id: 'sample', label: 'Open the sample page', run: loadSample },
    ...(done.length
      ? [
          { id: 'merge', label: `Export ${done.length > 1 ? `all ${done.length} as ` : ''}one merged file`, hint: 'with table of contents', run: guard(async () => { const r = await saveText(mergeWithToc(outFiles, exportName), `${exportName}.md`); if (r) onSaved(r, 'Merged') }) },
          { id: 'zip', label: 'Export as zip', run: guard(async () => { const r = await saveZip(outFiles, exportName); if (r) onSaved(r, 'Zipped') }) },
          ...(canPickDirectory() ? [{ id: 'folderout', label: 'Export into a folder…', run: guard(async () => { const r = await saveToFolder(outFiles); if (r) onSaved(r, 'Filed') }) }] : []),
          { id: 'read', label: 'View: read', hint: 'Tab', run: () => { setDir(0); setMode('read') } },
          { id: 'source', label: 'View: source (edit, Ctrl F to find & replace)', run: () => { setDir(0); setMode('source') } },
          { id: 'compare', label: 'View: compare with original', run: () => { setDir(0); setMode('compare') } },
          { id: 'clear', label: 'Clear the desk', run: clearAll },
        ]
      : []),
    { id: 'archive', label: 'Open the archive', hint: 'Ctrl H', run: () => setHistoryOpen(true) },
    { id: 'keys', label: 'Keyboard shortcuts', hint: '?', run: () => setShortcutsOpen(true) },
    ...(window.mdify ? [{ id: 'full', label: 'Toggle full screen', hint: 'F11', run: () => { window.mdify?.toggleFullscreen() } }] : []),
    { id: 'sound', label: `Splash sound: turn ${soundOn() ? 'off' : 'on'}`, run: () => { const on = !soundOn(); setSoundOn(on); toast(`Splash sound ${on ? 'on' : 'off'}`, 'info') } },
  ]

  return (
    <div className="grain flex h-full flex-col">
      <header className="titlebar flex h-11 flex-none items-center gap-5 border-b border-rule px-4 lg:px-5">
        <button onClick={clearAll} className="flex items-baseline gap-2" aria-label="Mdify — back to the desk">
          <span className="font-serif text-[21px] font-medium italic leading-none tracking-[-0.02em] text-ink">Mdify</span>
          <span className="size-[5px] translate-y-[-2px] rounded-full bg-vermilion" aria-hidden />
        </button>
        <span className="label hidden text-faint md:inline">
          Session · {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
          {hasJobs && <> · <span className="text-pencil">{done.length} {done.length === 1 ? 'page' : 'pages'}</span></>}
        </span>
        <button
          onClick={() => setPaletteOpen(true)}
          className="mx-auto hidden h-7 w-[340px] items-center gap-3 rounded-[3px] border border-rule bg-paper/60 px-3 text-left transition-colors hover:border-rule-2 sm:flex"
        >
          <span className="label text-faint">Find</span>
          <span className="flex-1 truncate font-serif text-[14px] italic text-pencil">pages, phrases, commands</span>
          <span className="flex gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
        </button>
        <nav className="ml-auto flex items-center gap-5 sm:ml-0">
          <span className="label hidden items-center gap-2 text-pencil lg:flex" title={nativeEngine ? 'Microsoft MarkItDown engine is available as a fallback' : 'Everything runs on this device'}>
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: nativeEngine ? '#6fa8a3' : '#8fa37a', animationDuration: '2.4s' }} />
              <span className="relative size-2 rounded-full" style={{ background: nativeEngine ? '#6fa8a3' : '#8fa37a' }} />
            </span>
            {nativeEngine ? 'Native engine' : 'On-device'}
          </span>
          {installEvt && <TextButton onClick={async () => { await installEvt.prompt(); setInstallEvt(null) }}>Install</TextButton>}
          <TextButton onClick={() => setPaletteOpen(true)} className="sm:hidden">Find</TextButton>
          <TextButton onClick={() => setHistoryOpen(true)}>Archive</TextButton>
          <TextButton onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts" className="max-sm:hidden">?</TextButton>
          <WindowControls />
        </nav>
      </header>

      <AnimatePresence mode="wait">
        {!hasJobs ? (
          <motion.main key="empty" className="min-h-0 flex-1" exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}>
            <EmptyDesk onFiles={pickFiles} onFolder={pickFolder} onSample={loadSample} onRestore={restore} />
          </motion.main>
        ) : (
          <motion.div key="work" className="flex min-h-0 flex-1 flex-col lg:flex-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Inbox
              jobs={jobs}
              selectedId={selectedId}
              busy={busy}
              progress={progress}
              totalTokens={totalTokens}
              exportFiles={outFiles}
              exportName={exportName}
              onSelect={select}
              onRemove={(id) => { setJobs((js) => js.filter((j) => j.id !== id)); if (id === selectedId) setSelectedId(null) }}
              onRetry={(id) => patch(id, { status: 'queued', error: undefined })}
              onAddFiles={pickFiles}
              onAddFolder={pickFolder}
              onClear={clearAll}
              onExported={onSaved}
            />
            <main className="relative min-h-0 flex-1 border-t border-rule lg:border-t-0">
              {selected ? (
                <Sheet job={selected} tabs={done.map((j) => ({ id: j.id, name: j.name }))} onSelect={select} dir={dir} mode={mode} onMode={(m) => { setDir(0); setMode(m) }} onEdit={onEdit} onStamp={doStamp} onSaved={onSaved} />
              ) : (
                <div className="grid h-full place-items-center px-6">
                  <div className="w-full max-w-[420px] text-center">
                    <p className="font-serif text-[26px] italic text-ink-2">{busy ? 'Setting the type…' : 'Pick a page from the inbox.'}</p>
                    {busy && <span className="pen-line mx-auto mt-6 block w-40" />}
                  </div>
                </div>
              )}
              <Stamp stamp={stamp} />
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) addPicked(fromFileList(e.target.files)); e.target.value = '' }} />
      <input
        ref={folderInputRef}
        type="file"
        hidden
        {...({ webkitdirectory: '', directory: '' } as object)}
        onChange={(e) => { if (e.target.files?.length) addPicked(fromFileList(e.target.files)); e.target.value = '' }}
      />
      <DragVeil active={drag.active} count={drag.count} />
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onRestore={restore} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Receipt
        receipt={receipt}
        onClose={() => setReceipt(null)}
        onNewBatch={() => { setReceipt(null); clearAll() }}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} jobs={jobs} commands={commands} onOpenJob={select} />
    </div>
  )
}
