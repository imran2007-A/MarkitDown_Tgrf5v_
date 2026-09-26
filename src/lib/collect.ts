import JSZip from 'jszip'
import { IGNORED_DIRS, kindOf } from './formats'

export interface Picked {
  file: File
  relPath: string
  supported: boolean
}

const MAX_FILES = 2000

function pick(file: File, relPath: string): Picked {
  return { file, relPath, supported: kindOf(file.name) !== null }
}

function isIgnoredPath(relPath: string): boolean {
  return relPath.split('/').slice(0, -1).some((seg) => IGNORED_DIRS.has(seg) || (seg.startsWith('.') && seg !== '.'))
}

async function readEntry(entry: FileSystemEntry, out: Picked[]): Promise<void> {
  if (out.length >= MAX_FILES) return
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej))
    const relPath = entry.fullPath.replace(/^\//, '')
    if (!isIgnoredPath(relPath)) out.push(pick(file, relPath))
    return
  }
  if (IGNORED_DIRS.has(entry.name) || (entry.name.startsWith('.') && entry.name.length > 1)) return
  const reader = (entry as FileSystemDirectoryEntry).createReader()
  let batch: FileSystemEntry[]
  do {
    batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
    for (const e of batch) await readEntry(e, out)
  } while (batch.length)
}

export async function fromDataTransfer(dt: DataTransfer): Promise<Picked[]> {
  const out: Picked[] = []
  const entries = Array.from(dt.items)
    .filter((i) => i.kind === 'file')
    .map((i) => i.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e)
  if (entries.length) {
    for (const e of entries) await readEntry(e, out)
    return out
  }
  return Array.from(dt.files).map((f) => pick(f, f.name))
}

export function fromFileList(list: FileList): Picked[] {
  return Array.from(list)
    .slice(0, MAX_FILES)
    .map((f) => pick(f, f.webkitRelativePath || f.name))
    .filter((p) => !isIgnoredPath(p.relPath))
}

export async function expandZips(items: Picked[]): Promise<Picked[]> {
  const out: Picked[] = []
  for (const it of items) {
    if (!it.file.name.toLowerCase().endsWith('.zip')) {
      out.push(it)
      continue
    }
    const zip = await JSZip.loadAsync(await it.file.arrayBuffer())
    const base = it.relPath.replace(/\.zip$/i, '')
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || out.length >= MAX_FILES) continue
      const rel = `${base}/${entry.name}`
      if (isIgnoredPath(rel) || entry.name.includes('__MACOSX')) continue
      const name = entry.name.split('/').pop()!
      const file = new File([await entry.async('blob')], name)
      out.push(pick(file, rel))
    }
  }
  return out
}
