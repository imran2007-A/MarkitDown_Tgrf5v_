# Mdify

**Anything in. Markdown out.** Drop a file or an entire folder and get clean, structured Markdown, ready for notes, docs, or any AI chat.

- **Formats:** PDF (including scanned PDFs via OCR), Word, PowerPoint, Excel/CSV, HTML, images (OCR), JSON, Jupyter notebooks, 60+ code languages, and `.zip` archives. The desktop app adds EPUB and Outlook `.msg`.
- **Folders:** keeps the structure and skips `node_modules`, `.git`, build output and other junk.
- **Export:** one merged `.md` with a table of contents, a `.zip`, individual files, or save straight into a folder.
- **Live editor:** preview, edit, or split view with syntax highlighting.
- **AI-ready:** exact token counts, "fits in ChatGPT / Claude / Gemini" indicators, and one-click **Copy for AI**.
- **History:** past conversions are stored locally on your device.
- **Private:** everything runs on your device. Nothing is uploaded.

## Download

- **Windows:** [**Mdify-Setup.exe**](https://github.com/imran2007-A/Mdify/releases/latest/download/Mdify-Setup.exe) (latest release). Windows may say "Windows protected your PC" because the app isn't code-signed yet; click **More info → Run anyway**.
- **Any browser / Android:** open **[mdify-smoky.vercel.app](https://mdify-smoky.vercel.app)** and choose *Install app* (or *Add to Home screen*).
- All versions and release notes: [Releases](https://github.com/imran2007-A/Mdify/releases).

## Two apps, one codebase

| | Web / Android (PWA) | Windows desktop (Electron) |
|---|---|---|
| Engine | In-browser (pdf.js, mammoth, SheetJS, Tesseract) | Same, plus Microsoft **MarkItDown** as a fallback |
| Offline | Yes, after first load | Yes |
| Save to folder | Chrome desktop | Yes |
| Install | Open the site → *Install app* / *Add to Home screen* | Run `Mdify-Setup.exe` |

## Develop

```bash
npm install
npm run dev              # web app at http://localhost:5173
```

Desktop, with the native engine:

```bash
python -m venv .venv && .venv/bin/pip install -r engine/requirements.txt   # Windows: .venv\Scripts\pip
npm run electron:dev
```

## Build

- **Windows installer:** push a tag such as `v1.0.0`, or run the **Desktop build** workflow manually. The `.exe` is attached to the GitHub Release (or to the workflow run as an artifact).
- **Web:** `npm run build` outputs `dist/`. `vercel.json` is ready to deploy on Vercel.

## Project layout

```
src/lib/convert/   converters (pdf, office, html, ocr) + engine routing
src/lib/           folder walking, export, tokens, history
src/components/    UI
electron/          desktop shell (main + preload)
engine/            MarkItDown sidecar (JSON over stdin/stdout) + PyInstaller build
```

## Credits

UI effects are adapted from MIT-licensed [Uiverse.io](https://uiverse.io) components. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
