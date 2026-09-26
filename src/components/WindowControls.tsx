import { useEffect, useState } from 'react'

/** In borderless full screen the OS buttons are gone, so draw our own. */
export function WindowControls() {
  const bridge = window.mdify
  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!bridge) return
    bridge.isFullscreen().then(setFull).catch(() => {})
    return bridge.onFullscreenChange((on) => setFull(on))
  }, [bridge])

  // Real key presses are caught in the main process (which stops them reaching the page);
  // this covers keys delivered straight to the page, so a press never toggles twice.
  useEffect(() => {
    if (!bridge) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') { e.preventDefault(); bridge.toggleFullscreen() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bridge])

  useEffect(() => {
    if (full) document.documentElement.dataset.fullscreen = ''
    else delete document.documentElement.dataset.fullscreen
  }, [full])

  if (!bridge || !full) return null
  const btn = 'grid h-7 w-8 place-items-center rounded-[3px] font-mono text-[13px] text-pencil transition-colors hover:bg-rule/70 hover:text-ink'
  return (
    <div className="-mr-1 ml-1 flex items-center gap-0.5 border-l border-rule pl-3" role="group" aria-label="Window">
      <button className={btn} onClick={() => bridge.minimize()} title="Minimize" aria-label="Minimize">–</button>
      <button className={btn} onClick={() => bridge.toggleFullscreen()} title="Exit full screen (F11)" aria-label="Exit full screen">⤢</button>
      <button className={`${btn} hover:bg-vermilion hover:text-desk`} onClick={() => bridge.close()} title="Close" aria-label="Close">×</button>
    </div>
  )
}
