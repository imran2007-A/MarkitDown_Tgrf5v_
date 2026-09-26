import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('mdify', {
  isDesktop: true,
  platform: process.platform,
  engineAvailable: () => ipcRenderer.invoke('engine:available'),
  getPathForFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      return ''
    }
  },
  convertNative: (p: string) => ipcRenderer.invoke('engine:convert', p),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  saveFiles: (dir: string, files: { relPath: string; content: string }[]) => ipcRenderer.invoke('fs:saveFiles', dir, files),
  saveFile: (name: string, data: string | Uint8Array) => ipcRenderer.invoke('fs:saveFile', name, data),
  revealInFolder: (p: string) => ipcRenderer.invoke('shell:reveal', p),
  isFullscreen: () => ipcRenderer.invoke('window:isFullscreen'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  onFullscreenChange: (cb: (on: boolean) => void) => {
    const listener = (_e: unknown, on: boolean) => cb(on)
    ipcRenderer.on('window:fullscreen', listener)
    return () => { ipcRenderer.removeListener('window:fullscreen', listener) }
  },
})
