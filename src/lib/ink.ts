import { kindOf, type Kind } from './formats'

export interface Ink {
  color: string
  label: string
}

// One ink per family of files, like coloured pens and folder tabs
export const INKS: Record<Kind | 'other', Ink> = {
  pdf: { color: '#d0654f', label: 'PDF' },
  docx: { color: '#7d95c4', label: 'Word' },
  pptx: { color: '#d4a04a', label: 'Slides' },
  sheet: { color: '#86ad6e', label: 'Sheets' },
  html: { color: '#cc8098', label: 'Web' },
  image: { color: '#ab8bc9', label: 'Images' },
  data: { color: '#c9b25a', label: 'Data' },
  code: { color: '#8e8ae0', label: 'Code' },
  text: { color: '#a39c8f', label: 'Text' },
  archive: { color: '#a39c8f', label: 'Zip' },
  native: { color: '#6fa8a3', label: 'Books & mail' },
  other: { color: '#7d776d', label: 'Other' },
}

export function inkOf(name: string): Ink & { kind: Kind | 'other' } {
  const kind = kindOf(name) ?? 'other'
  return { ...INKS[kind], kind }
}
