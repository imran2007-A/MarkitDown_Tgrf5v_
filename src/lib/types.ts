export type JobStatus = 'queued' | 'converting' | 'done' | 'error' | 'skipped'

export interface Job {
  id: string
  file: File
  relPath: string
  name: string
  ext: string
  size: number
  status: JobStatus
  progress?: string
  markdown?: string
  error?: string
  tokens?: number
  engine?: 'native' | 'browser'
  ms?: number
  restored?: boolean
}

export interface HistoryEntry {
  id: string
  title: string
  createdAt: number
  fileCount: number
  tokens: number
  files: { relPath: string; markdown: string }[]
}

export interface DesktopBridge {
  isDesktop: true
  platform: string
  engineAvailable: () => Promise<boolean>
  getPathForFile: (file: File) => string
  convertNative: (path: string) => Promise<{ markdown?: string; error?: string }>
  pickFolder: () => Promise<string | null>
  saveFiles: (dir: string, files: { relPath: string; content: string }[]) => Promise<{ written: number }>
  revealInFolder: (path: string) => Promise<void>
}

declare global {
  interface Window {
    mdify?: DesktopBridge
  }
}
