import React, { useState, useEffect } from 'react'
import SetupModal from './components/SetupModal'
import SettingsModal from './components/SettingsModal'
import EditConfirmationModal from './components/EditConfirmationModal'
import ReplyArea from './components/ReplyArea'
import AIChat from './components/AIChat'
import ResizableContainer from './components/ResizableContainer'
import { parseCommand, generateSystemPrompt } from './utils/commandParser'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isCommand?: boolean
}

function App() {
  const [isSetup, setIsSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showEditConfirmation, setShowEditConfirmation] = useState(false)
  const [editPreview, setEditPreview] = useState({
    originalText: '',
    editedText: '',
    instruction: ''
  })

  const checkExistingApiKey = async () => {
    try {
      const result = await window.electronAPI.checkApiKey()
      if (result.hasApiKey) {
        const threadResult = await window.electronAPI.createThread()
        if (threadResult.success) {
          setIsSetup(true)
          await loadMessages()
        }
      }
    } catch (err: any) {
      console.error('APIキーの確認に失敗しました:', err)
    }
  }

  const handleSetupComplete = async (apiKey: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await window.electronAPI.setApiKey(apiKey)
      if (result.success) {
        const threadResult = await window.electronAPI.createThread()
        if (threadResult.success) {
          setIsSetup(true)
          await loadMessages()
        } else {
          setError(threadResult.error || 'スレッドの作成に失敗しました')
        }
      } else {
        setError(result.error || 'APIキーの設定に失敗しました')
      }
    } catch (err: any) {
      setError(err.message || '予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeyUpdate = async (apiKey: string) => {
    try {
      const threadResult = await window.electronAPI.createThread()
      if (threadResult.success) {
        setIsSetup(true)
        await loadMessages()
        setShowSettings(false)
      }
    } catch (err: any) {
      setError(err.message || 'スレッドの作成に失敗しました')
    }
  }

  const loadMessages = async () => {
    try {
      const result = await window.electronAPI.getThreadMessages()
      if (result.success && result.messages) {
        setThreadMessages(result.messages.reverse())
      }
    } catch (err: any) {
      console.error('メッセージの読み込みに失敗しました:', err)
    }
  }

  const handleSendChatMessage = async (message: string) => {
    if (!message.trim() || isLoading) return // ローディング中は送信を防ぐ

    setIsLoading(true)
    setLoadingMessage('AIが考えています...')
    setError('')
    
    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    setChatMessages(prev => [...prev, userMessage])
    
    try {
      // コマンド解析
      const command = parseCommand(message, replyContent)
      console.log('Command parsed:', command) // デバッグ用
      
      // コマンドに応じてローディングメッセージとタイマーを設定
      let loadingTimer: NodeJS.Timeout
      let longLoadingTimer: NodeJS.Timeout
      
      if (command.action === 'research') {
        setLoadingMessage('検索しています...')
        loadingTimer = setTimeout(() => {
          setLoadingMessage('情報を検索中です。しばらくお待ちください...')
        }, 10000)
        longLoadingTimer = setTimeout(() => {
          setLoadingMessage('詳細な情報を調査中です...')
        }, 30000)
      } else {
        loadingTimer = setTimeout(() => {
          setLoadingMessage('処理に時間がかかっています。しばらくお待ちください...')
        }, 10000)
        longLoadingTimer = setTimeout(() => {
          setLoadingMessage('もうしばらくお待ちください。複雑な処理を実行中です...')
        }, 30000)
      }
      
      // 編集コマンドで確認が必要な場合は編集プレビューを生成
      if (command.action === 'edit' && command.needsConfirmation) {
        clearTimeout(loadingTimer)
        clearTimeout(longLoadingTimer)
        await handleEditPreview(message, command)
        return
      }
      
      // OpenAI Assistants APIはスレッド内で自動的に会話履歴を保持するため、
      // 手動で会話履歴を送信する必要はありません
      const systemPrompt = generateSystemPrompt(command, replyContent)
      
      // タイムアウト処理付きでAPIを呼び出し
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('リクエストがタイムアウトしました。再度お試しください。')), 120000) // 2分タイムアウト
      })
      
      const result = await Promise.race([
        window.electronAPI.sendMessage(message, systemPrompt),
        timeoutPromise
      ])
      
      // タイマーをクリア
      clearTimeout(loadingTimer)
      clearTimeout(longLoadingTimer)
      
      if (result.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}-${Math.random()}`, // より確実なユニークID
          role: 'assistant',
          content: (result.response || '').replace(/\n{2,}/g, '\n').trim(),
          timestamp: Date.now() + 1, // わずかに後の時刻を設定
          isCommand: command.isCommand
        }
        
        // 重複チェックしてから追加
        setChatMessages(prev => {
          const isDuplicate = prev.some(msg => 
            msg.role === 'assistant' && 
            msg.content === assistantMessage.content &&
            Math.abs(msg.timestamp - assistantMessage.timestamp) < 5000
          )
          
          if (isDuplicate) {
            console.log('Duplicate assistant message detected, skipping')
            return prev
          }
          
          return [...prev, assistantMessage]
        })
        
        // コマンドの場合は返信エリアを更新
        if (command.isCommand && ['create', 'append', 'modify', 'remove', 'edit', 'research'].includes(command.action)) {
          console.log('Updating reply content:', result.response) // デバッグ用
          setReplyContent((result.response || '').replace(/\n{2,}/g, '\n').trim())
        }
        
        // スレッドメッセージの読み込みは少し遅延
        setTimeout(() => {
          loadMessages()
        }, 500)
      } else {
        setError(result.error || 'メッセージの送信に失敗しました')
      }
    } catch (err: any) {
      clearTimeout(loadingTimer)
      clearTimeout(longLoadingTimer)
      setError(err.message || 'メッセージの送信に失敗しました')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  const handleCopyReply = () => {
    if (replyContent) {
      navigator.clipboard.writeText(replyContent)
    }
  }

  const handleClearReply = () => {
    setReplyContent('')
  }


  const handleEditPreview = async (message: string, command: any) => {
    setLoadingMessage('編集プレビューを生成しています...')
    
    // 長時間のローディング状態を示すタイマー
    const loadingTimer = setTimeout(() => {
      setLoadingMessage('編集処理に時間がかかっています。しばらくお待ちください...')
    }, 10000) // 10秒後
    
    try {
      // OpenAI Assistants APIのスレッド機能により会話履歴は自動保持されます
      const systemPrompt = generateSystemPrompt(command, replyContent)
      
      // タイムアウト処理付きでAPIを呼び出し
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('編集プレビューの生成がタイムアウトしました。再度お試しください。')), 120000) // 2分タイムアウト
      })
      
      const result = await Promise.race([
        window.electronAPI.sendMessage(message, systemPrompt),
        timeoutPromise
      ])
      
      clearTimeout(loadingTimer)
      
      if (result.success) {
        setEditPreview({
          originalText: replyContent,
          editedText: result.response || '',
          instruction: message
        })
        setShowEditConfirmation(true)
      } else {
        setError(result.error || '編集プレビューの生成に失敗しました')
      }
    } catch (err: any) {
      clearTimeout(loadingTimer)
      setError(err.message || '編集プレビューの生成に失敗しました')
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  const handleEditConfirm = () => {
    setReplyContent(editPreview.editedText)
    setShowEditConfirmation(false)
    
    // AIレスポンスメッセージを追加
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}-${Math.random()}`,
      role: 'assistant',
      content: editPreview.editedText,
      timestamp: Date.now(),
      isCommand: true
    }
    
    setChatMessages(prev => [...prev, assistantMessage])
    
    // スレッドメッセージの読み込み
    setTimeout(() => {
      loadMessages()
    }, 500)
  }

  const handleEditCancel = () => {
    setShowEditConfirmation(false)
    setIsLoading(false)
  }

  useEffect(() => {
    // 保存された設定を監視
    const handleConfigLoaded = (config: { hasApiKey: boolean; ratio?: number }) => {
      if (config.hasApiKey) {
        const initializeApp = async () => {
          const threadResult = await window.electronAPI.createThread()
          if (threadResult.success) {
            setIsSetup(true)
            await loadMessages()
          }
        }
        initializeApp()
      }
    }
    
    window.electronAPI.onConfigLoaded(handleConfigLoaded)
    
    // フォールバックとして手動チェック
    checkExistingApiKey()
  }, [])

  if (!isSetup) {
    return (
      <SetupModal 
        onSetupComplete={handleSetupComplete}
        isLoading={isLoading}
        error={error}
      />
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Chat Assistant</h1>
        <div className="header-controls">
          <button 
            className="gear-button" 
            onClick={() => setShowSettings(true)}
            title="設定"
          >
            ⚙️
          </button>
          <div className="window-controls">
            <button 
              className="window-button minimize"
              onClick={() => window.electronAPI?.minimize()}
              title="最小化"
            />
            <button 
              className="window-button maximize"
              onClick={() => window.electronAPI?.maximize()}
              title="最大化"
            />
            <button 
              className="window-button close"
              onClick={() => window.electronAPI?.close()}
              title="閉じる"
            />
          </div>
        </div>
      </div>
      
      <div className="content-wrapper">
        {error && (
          <div className="error">
            エラー: {error}
          </div>
        )}
        
        <div className="main-content">
          <ResizableContainer>
            <ReplyArea
              content={replyContent}
              onChange={setReplyContent}
              onCopy={handleCopyReply}
              onClear={handleClearReply}
            />
            
            <AIChat
              messages={chatMessages}
              threadMessages={threadMessages}
              onSendMessage={handleSendChatMessage}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              onUpdateReply={setReplyContent}
              currentReply={replyContent}
            />
          </ResizableContainer>
        </div>
      </div>
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onApiKeyUpdate={handleApiKeyUpdate}
      />
      
      <EditConfirmationModal
        isOpen={showEditConfirmation}
        originalText={editPreview.originalText}
        editedText={editPreview.editedText}
        editInstruction={editPreview.instruction}
        onConfirm={handleEditConfirm}
        onCancel={handleEditCancel}
      />
    </div>
  )
}

export default App