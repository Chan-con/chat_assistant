import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  setApiKey: (apiKey: string) => Promise<{ success: boolean; assistantId?: string; error?: string }>
  checkApiKey: () => Promise<{ hasApiKey: boolean }>
  clearApiKey: () => Promise<{ success: boolean; error?: string }>
  createThread: () => Promise<{ success: boolean; threadId?: string; error?: string }>
  sendMessage: (content: string, instructions: string) => Promise<{ success: boolean; response?: string; messageId?: string; error?: string }>
  getThreadMessages: () => Promise<{ success: boolean; messages?: any[]; error?: string }>
  saveRatio: (ratio: number) => Promise<{ success: boolean; error?: string }>
  getSavedRatio: () => Promise<{ success: boolean; ratio: number }>
  showErrorDialog: (title: string, content: string) => Promise<void>
  showInfoDialog: (title: string, content: string) => Promise<number>
  onConfigLoaded: (callback: (config: { hasApiKey: boolean; ratio?: number }) => void) => void
  minimize: () => void
  maximize: () => void
  close: () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),
  checkApiKey: () => ipcRenderer.invoke('check-api-key'),
  clearApiKey: () => ipcRenderer.invoke('clear-api-key'),
  createThread: () => ipcRenderer.invoke('create-thread'),
  sendMessage: (content: string, instructions: string) => ipcRenderer.invoke('send-message', content, instructions),
  getThreadMessages: () => ipcRenderer.invoke('get-thread-messages'),
  saveRatio: (ratio: number) => ipcRenderer.invoke('save-ratio', ratio),
  getSavedRatio: () => ipcRenderer.invoke('get-saved-ratio'),
  showErrorDialog: (title: string, content: string) => ipcRenderer.invoke('show-error-dialog', title, content),
  showInfoDialog: (title: string, content: string) => ipcRenderer.invoke('show-info-dialog', title, content),
  onConfigLoaded: (callback: (config: { hasApiKey: boolean; ratio?: number }) => void) => {
    ipcRenderer.on('config-loaded', (event, config) => callback(config))
  },
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close')
} as ElectronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}