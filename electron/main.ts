import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import OpenAI from 'openai'

let mainWindow: BrowserWindow | null = null
let openai: OpenAI | null = null
let currentAssistantId: string | null = null
let currentThreadId: string | null = null

const isDev = process.env.NODE_ENV === 'development'
const configPath = path.join(os.homedir(), '.chat-assistant-config.json')
const windowSettingsPath = path.join(os.homedir(), '.chat-assistant-window.json')

interface WindowSettings {
  width: number
  height: number
  x?: number
  y?: number
}

function loadWindowSettings(): WindowSettings {
  try {
    if (fs.existsSync(windowSettingsPath)) {
      const settings = JSON.parse(fs.readFileSync(windowSettingsPath, 'utf8'))
      return {
        width: settings.width || 800,
        height: settings.height || 900,
        x: settings.x,
        y: settings.y
      }
    }
  } catch (error) {
    console.error('Failed to load window settings:', error)
  }
  return { width: 800, height: 900 }
}

function saveWindowSettings() {
  try {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      fs.writeFileSync(windowSettingsPath, JSON.stringify(bounds, null, 2))
    }
  } catch (error) {
    console.error('Failed to save window settings:', error)
  }
}

function createWindow(): void {
  // 保存されたウィンドウ設定を読み込み
  const windowSettings = loadWindowSettings()
  
  mainWindow = new BrowserWindow({
    height: windowSettings.height,
    width: windowSettings.width,
    x: windowSettings.x,
    y: windowSettings.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    show: false,
  })
  
  // ウィンドウサイズの変更を監視
  mainWindow.on('resize', saveWindowSettings)
  mainWindow.on('move', saveWindowSettings)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../react/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  loadSavedConfig()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

async function loadSavedConfig() {
  try {
    const config = loadConfig()
    if (config.apiKey) {
      console.log('Loading saved API key...')
      const success = await initializeOpenAI(config.apiKey)
      if (success) {
        console.log('API key loaded successfully')
        // ウィンドウが準備できたら設定を送信
        if (mainWindow) {
          const sendConfig = () => {
            console.log('Sending config to renderer')
            mainWindow?.webContents.send('config-loaded', { 
              hasApiKey: true, 
              ratio: config.ratio 
            })
          }
          
          if (mainWindow.webContents.isLoading()) {
            mainWindow.webContents.once('did-finish-load', sendConfig)
          } else {
            setTimeout(sendConfig, 1000) // 少し遅延して送信
          }
        }
      } else {
        console.log('Failed to initialize with saved API key')
      }
    } else {
      console.log('No saved API key found')
    }
  } catch (error) {
    console.error('Failed to load saved config:', error)
  }
}

function saveConfig(apiKey: string, ratio?: number) {
  try {
    const config = { apiKey, ratio }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Failed to save config:', error)
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
  return {}
}

async function initializeOpenAI(apiKey: string) {
  try {
    openai = new OpenAI({ apiKey })
    
    const assistant = await openai.beta.assistants.create({
      name: "Chat Assistant",
      instructions: "あなたは日本語でチャットの返事を書くのを手伝うアシスタントです。ユーザーの大まかな内容を整理し、適切で丁寧な返事を提案してください。\n\n【重要な書式指定】\n- 返信は1行開けることなく、行を詰めて短くまとめてください\n- 無駄な改行を削除し、コンパクトに表示してください\n- 返信文は簡潔に要点をまとめ、長文を避けてください\n- 改行は必要最小限に留め、連続する改行は使用しないでください\n\n【調査について】\n- 調査が必要な場合は「最新情報を調べる必要があります」と明記してください\n- 推測や一般的な知識のみで長文を書くことは避け、「詳細は公式ドキュメントをご確認ください」のように案内してください",
      tools: [],
      model: "gpt-4o",
    })
    
    currentAssistantId = assistant.id
    return true
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error)
    return false
  }
}

ipcMain.handle('set-api-key', async (event, apiKey: string) => {
  try {
    const success = await initializeOpenAI(apiKey)
    if (success) {
      saveConfig(apiKey)
      return { success: true, assistantId: currentAssistantId }
    } else {
      return { success: false, error: 'OpenAI initialization failed' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('check-api-key', async () => {
  return { hasApiKey: !!openai && !!currentAssistantId }
})

ipcMain.handle('clear-api-key', async () => {
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
    openai = null
    currentAssistantId = null
    currentThreadId = null
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-ratio', async (event, ratio: number) => {
  try {
    const config = loadConfig()
    saveConfig(config.apiKey || '', ratio)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-saved-ratio', async () => {
  try {
    const config = loadConfig()
    return { success: true, ratio: config.ratio || 0.4 }
  } catch (error: any) {
    return { success: false, ratio: 0.4 }
  }
})

// ウィンドウ制御
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle('create-thread', async () => {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not set')
    }
    
    const thread = await openai.beta.threads.create()
    currentThreadId = thread.id
    
    return { success: true, threadId: thread.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('send-message', async (event, content: string, instructions: string) => {
  try {
    if (!openai || !currentAssistantId || !currentThreadId) {
      throw new Error('OpenAI not initialized or thread not created')
    }

    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: content
    })

    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: currentAssistantId,
      instructions: instructions
    })

    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
    }

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(currentThreadId)
      const latestMessage = messages.data[0]
      
      if (latestMessage.content[0].type === 'text') {
        return { 
          success: true, 
          response: latestMessage.content[0].text.value,
          messageId: latestMessage.id
        }
      }
    }

    throw new Error(`Run failed with status: ${runStatus.status}`)
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-thread-messages', async () => {
  try {
    if (!openai || !currentThreadId) {
      throw new Error('OpenAI not initialized or thread not created')
    }

    const messages = await openai.beta.threads.messages.list(currentThreadId)
    return { 
      success: true, 
      messages: messages.data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
        created_at: msg.created_at
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('show-error-dialog', async (event, title: string, content: string) => {
  if (mainWindow) {
    dialog.showErrorBox(title, content)
  }
})

ipcMain.handle('show-info-dialog', async (event, title: string, content: string) => {
  if (mainWindow) {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: title,
      message: content,
      buttons: ['OK']
    })
    return result.response
  }
})