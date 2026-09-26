import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'

const DIST = path.join(__dirname, '..', 'dist')
const isWin = process.platform === 'win32'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
])

// ─── Native engine (MarkItDown sidecar) ───
type Pending = { resolve: (v: { markdown?: string; error?: string }) => void }
let engine: ChildProcessWithoutNullStreams | null = null
let engineReady: Promise<boolean> | null = null
const pending = new Map<string, Pending>()
let seq = 0

function engineCommand(): { cmd: string; args: string[] } | null {
  const packaged = path.join(process.resourcesPath, 'engine', isWin ? 'mdify-engine.exe' : 'mdify-engine')
  if (app.isPackaged) return existsSync(packaged) ? { cmd: packaged, args: [] } : null
  const script = path.join(__dirname, '..', 'engine', 'mdify_engine.py')
  const venvPy = path.join(__dirname, '..', '.venv', isWin ? 'Scripts/python.exe' : 'bin/python')
  return { cmd: existsSync(venvPy) ? venvPy : isWin ? 'python' : 'python3', args: [script] }
}

function startEngine(): Promise<boolean> {
  if (engineReady) return engineReady
  engineReady = new Promise((resolve) => {
    const c = engineCommand()
    if (!c) return resolve(false)
    const proc = spawn(c.cmd, c.args, { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
    engine = proc
    const timer = setTimeout(() => resolve(false), 60_000)
    proc.on('error', () => { clearTimeout(timer); resolve(false) })
    proc.on('exit', () => {
      engine = null
      engineReady = null
      for (const p of pending.values()) p.resolve({ error: 'Engine stopped' })
      pending.clear()
    })
    proc.stderr.on('data', (d) => console.error('[engine]', String(d)))
    createInterface({ input: proc.stdout }).on('line', (line) => {
      try {
        const msg = JSON.parse(line)
        if (msg.ready) { clearTimeout(timer); resolve(true); return }
        pending.get(msg.id)?.resolve(msg)
        pending.delete(msg.id)
      } catch { /* non-JSON noise from libraries */ }
    })
  })
  return engineReady
}

async function convertNative(filePath: string): Promise<{ markdown?: string; error?: string }> {
  if (!(await startEngine()) || !engine) return { error: 'Native engine unavailable' }
  const id = String(++seq)
  return new Promise((resolve) => {
    pending.set(id, { resolve })
    engine!.stdin.write(JSON.stringify({ id, path: filePath }) + '\n')
  })
}

function safeJoin(root: string, rel: string): string {
  const target = path.resolve(root, rel)
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error(`Refusing to write outside the chosen folder: ${rel}`)
  return target
}

function registerIpc() {
  ipcMain.handle('engine:available', () => engineCommand() !== null)
  ipcMain.handle('engine:convert', (_e, filePath: string) => convertNative(filePath))
  ipcMain.handle('dialog:pickFolder', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)!
    const r = await dialog.showOpenDialog(win, { title: 'Save Markdown files to…', properties: ['openDirectory', 'createDirectory'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle('fs:saveFiles', async (_e, dir: string, files: { relPath: string; content: string }[]) => {
    const root = path.resolve(dir)
    let written = 0
    for (const f of files) {
      const target = safeJoin(root, f.relPath)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, f.content, 'utf8')
      written++
    }
    return { written }
  })
  ipcMain.handle('fs:saveFile', async (e, name: string, data: string | Uint8Array) => {
    const win = BrowserWindow.fromWebContents(e.sender)!
    const isZip = name.toLowerCase().endsWith('.zip')
    const r = await dialog.showSaveDialog(win, {
      title: 'Save as',
      defaultPath: path.join(app.getPath('downloads'), path.basename(name)),
      filters: isZip ? [{ name: 'Zip archive', extensions: ['zip'] }] : [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (r.canceled || !r.filePath) return null
    await writeFile(r.filePath, typeof data === 'string' ? data : Buffer.from(data))
    return r.filePath
  })
  ipcMain.handle('window:isFullscreen', (e) => BrowserWindow.fromWebContents(e.sender)?.isFullScreen() ?? false)
  ipcMain.handle('window:toggleFullscreen', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (w) w.setFullScreen(!w.isFullScreen())
  })
  ipcMain.handle('window:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.handle('window:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())
  ipcMain.handle('shell:reveal', async (_e, p: string) => {
    const isDir = await stat(p).then((st) => st.isDirectory()).catch(() => false)
    if (isDir) await shell.openPath(p)
    else shell.showItemInFolder(p)
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#100f0e',
    title: 'Mdify',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: isWin || process.platform === 'linux' ? { color: '#100f0e', symbolColor: '#7d776d', height: 44 } : undefined,
    trafficLightPosition: { x: 16, y: 20 },
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  })
  win.once('ready-to-show', () => win.show())
  const sendState = () => win.webContents.send('window:fullscreen', win.isFullScreen())
  win.on('enter-full-screen', sendState)
  win.on('leave-full-screen', sendState)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      e.preventDefault()
      win.setFullScreen(!win.isFullScreen())
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) e.preventDefault()
  })
  win.loadURL('app://mdify/index.html')
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [w] = BrowserWindow.getAllWindows()
    if (w) { if (w.isMinimized()) w.restore(); w.focus() }
  })

  app.whenReady().then(() => {
    protocol.handle('app', (req) => {
      const { pathname } = new URL(req.url)
      const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)))
      if (!file.startsWith(DIST)) return new Response('Forbidden', { status: 403 })
      return net.fetch(pathToFileURL(file).toString())
    })
    registerIpc()
    createWindow()
    startEngine()
    app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
  })

  app.on('window-all-closed', () => {
    engine?.kill()
    if (process.platform !== 'darwin') app.quit()
  })
}
