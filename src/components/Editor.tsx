import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { tags as t } from '@lezer/highlight'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'

const theme = EditorView.theme(
  {
    '&': { color: '#b8b1a4', backgroundColor: 'transparent' },
    '.cm-content': { caretColor: '#e5532d', padding: '0 0 40vh', maxWidth: '68ch', margin: '0 auto' },
    '.cm-cursor': { borderLeftColor: '#e5532d', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#e5532d33 !important' },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-line': { padding: '0 28px' },
    '.cm-panels': { backgroundColor: '#1f1e1b', color: '#b8b1a4', borderColor: '#2b2926' },
    '.cm-panels.cm-panels-top': { borderBottom: '1px solid #2b2926' },
    '.cm-panel.cm-search': { padding: '10px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px' },
    '.cm-panel.cm-search input, .cm-panel.cm-search button': { fontFamily: 'inherit', fontSize: '11px', background: '#191816', color: '#ebe5d9', border: '1px solid #3a3733', borderRadius: '2px', padding: '3px 8px', backgroundImage: 'none' },
    '.cm-panel.cm-search label': { color: '#7d776d' },
    '.cm-searchMatch': { backgroundColor: '#e5532d33', outline: '1px solid #e5532d88' },
    '.cm-searchMatch-selected': { backgroundColor: '#e5532d66' },
  },
  { dark: true },
)

// iA Writer-style: syntax marks stay visible but recede; content keeps its weight
const highlight = HighlightStyle.define([
  { tag: t.heading1, color: '#ebe5d9', fontWeight: '600', fontSize: '1.35em' },
  { tag: t.heading2, color: '#ebe5d9', fontWeight: '600', fontSize: '1.18em' },
  { tag: [t.heading3, t.heading4, t.heading5, t.heading6], color: '#ebe5d9', fontWeight: '600' },
  { tag: [t.processingInstruction, t.meta], color: '#57524b' },
  { tag: t.strong, color: '#ebe5d9', fontWeight: '600' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#ebe5d9' },
  { tag: [t.link, t.url], color: '#e5532d' },
  { tag: t.monospace, color: '#d8c7a3' },
  { tag: t.quote, color: '#7d776d', fontStyle: 'italic' },
  { tag: [t.list, t.contentSeparator], color: '#e5532d' },
  { tag: t.keyword, color: '#d19a66' },
  { tag: t.string, color: '#8fa37a' },
  { tag: t.comment, color: '#57524b', fontStyle: 'italic' },
  { tag: [t.number, t.bool], color: '#d8c7a3' },
])

export default function Editor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      autoFocus
      theme="none"
      basicSetup={{ foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false, lineNumbers: false, autocompletion: false }}
      extensions={[markdown({ base: markdownLanguage, codeLanguages: languages }), theme, syntaxHighlighting(highlight), EditorView.lineWrapping]}
    />
  )
}
