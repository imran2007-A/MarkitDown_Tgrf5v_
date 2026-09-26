import { motion } from 'motion/react'
import { Kbd } from './ui'

interface Props {
  onFiles: () => void
  onFolder: () => void
  onSample: () => void
}

const RULED = 'repeating-linear-gradient(to bottom, transparent 0 31px, rgb(255 245 230 / 0.035) 31px 32px)'

export function EmptyDesk({ onFiles, onFolder, onSample }: Props) {
  return (
    <div className="grid h-full place-items-center overflow-hidden px-5 py-10">
      <div className="relative w-full max-w-[560px]">
        <motion.div
          aria-hidden
          className="sheet absolute inset-0 rounded-[2px] opacity-60"
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
          style={{ backgroundImage: RULED }}
        >
          <p className="label flex justify-between text-faint">
            <span>No. 00</span>
            <span>Untitled</span>
          </p>
          <h1 className="mt-12 font-serif text-[34px] font-[420] italic leading-[1.08] tracking-[-0.02em] text-ink sm:mt-14 sm:text-[46px]">
            <span className="pointer-coarse:hidden">Drop</span><span className="hidden pointer-coarse:inline">Open</span> a file, a folder,
            <br />
            or a whole zip.
          </h1>
          <div className="mt-14 space-y-3 font-serif text-[18px] text-ink-2">
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
              <span className="label text-faint pointer-coarse:hidden">↵</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
