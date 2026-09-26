import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { tags as t } from '@lezer/highlight'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'

const theme = EditorView.theme(
  {
    '&': { color: '#d4d4da', backgroundColor: 'transparent' },
    '.cm-content': { caretColor: '#a78bfa', padding: '16px 0' },
    '.cm-cursor': { borderLeftColor: '#a78bfa' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'rgb(167 139 250 / 0.22) !important' },
    '.cm-activeLine': { backgroundColor: 'rgb(255 255 255 / 0.025)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#a1a1aa' },
    '.cm-line': { padding: '0 16px' },
  },
  { dark: true },
)

const highlight = HighlightStyle.define([
  { tag: t.heading1, color: '#fff', fontWeight: '700' },
  { tag: [t.heading2, t.heading3, t.heading4], color: '#e9e3ff', fontWeight: '600' },
  { tag: t.processingInstruction, color: '#8b5cf6' },
  { tag: t.strong, color: '#fff', fontWeight: '600' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#e4e4e7' },
  { tag: [t.link, t.url], color: '#22d3ee' },
  { tag: t.monospace, color: '#fbbf24' },
  { tag: t.quote, color: '#8b8b96', fontStyle: 'italic' },
  { tag: [t.list, t.contentSeparator], color: '#a78bfa' },
  { tag: t.keyword, color: '#c084fc' },
  { tag: t.string, color: '#86efac' },
  { tag: t.comment, color: '#5c5c66' },
  { tag: [t.number, t.bool], color: '#f9a8d4' },
  { tag: [t.function(t.variableName), t.propertyName], color: '#67e8f9' },
])

export default function Editor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      style={{ height: '100%' }}
      theme="none"
      basicSetup={{ foldGutter: false, highlightActiveLine: true, lineNumbers: true, autocompletion: false }}
      extensions={[markdown({ base: markdownLanguage, codeLanguages: languages }), theme, syntaxHighlighting(highlight), EditorView.lineWrapping]}
    />
  )
}
