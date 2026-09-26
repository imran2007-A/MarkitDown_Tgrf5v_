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
  revealInFolder: (p: string) => ipcRenderer.invoke('shell:reveal', p),
})
