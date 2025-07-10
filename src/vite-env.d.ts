/// <reference types="vite/client" />

interface ElectronAPI {
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}