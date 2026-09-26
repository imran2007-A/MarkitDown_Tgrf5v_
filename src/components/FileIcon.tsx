import { FileCode2, FileImage, FileJson2, FileSpreadsheet, FileText, FileType2, Globe, Presentation, FileArchive, File, BookOpen } from 'lucide-react'
import { kindOf } from '../lib/formats'

const MAP = {
  pdf: { Icon: FileType2, color: '#f87171' },
  docx: { Icon: FileText, color: '#60a5fa' },
  pptx: { Icon: Presentation, color: '#fb923c' },
  sheet: { Icon: FileSpreadsheet, color: '#34d399' },
  html: { Icon: Globe, color: '#f472b6' },
  image: { Icon: FileImage, color: '#c084fc' },
  data: { Icon: FileJson2, color: '#fbbf24' },
  code: { Icon: FileCode2, color: '#22d3ee' },
  text: { Icon: FileText, color: '#a1a1aa' },
  archive: { Icon: FileArchive, color: '#a1a1aa' },
  native: { Icon: BookOpen, color: '#a78bfa' },
} as const

export function FileIcon({ name, size = 16 }: { name: string; size?: number }) {
  const kind = kindOf(name)
  const { Icon, color } = kind ? MAP[kind] : { Icon: File, color: '#71717a' }
  return (
    <span className="grid size-8 flex-none place-items-center rounded-lg border border-line" style={{ background: `${color}14` }}>
      <Icon size={size} color={color} strokeWidth={1.75} />
    </span>
  )
}
