import React, { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isCommand?: boolean
}

interface ThreadMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: number
}

interface AIChatProps {
  messages: ChatMessage[]
  threadMessages: ThreadMessage[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  loadingMessage?: string
  onUpdateReply: (content: string) => void
  currentReply: string
}

const AIChat: React.FC<AIChatProps> = ({ 
  messages, 
  threadMessages,
  onSendMessage, 
  isLoading,
  loadingMessage = '考えています...',
  onUpdateReply, 
  currentReply 
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputMessage.trim() || isLoading) return
    
    onSendMessage(inputMessage.trim())
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // エンター送信もShift+Enterも無効化
    // 送信はボタンのみ
  }

  // テキストエリアの高さを自動調整
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      
      const lineHeight = 24 // 1行の高さ（px）
      const maxLines = 6
      const maxHeight = lineHeight * maxLines
      
      const scrollHeight = textarea.scrollHeight
      const newHeight = Math.min(scrollHeight, maxHeight)
      
      textarea.style.height = `${newHeight}px`
    }
  }

  // 入力内容が変更されたとき
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    adjustTextareaHeight()
  }

  // コンポーネントマウント時に高さを調整
  React.useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  // 引用テキストの挿入を監視
  React.useEffect(() => {
    const handleInsertQuotedText = (event: CustomEvent) => {
      const quotedText = event.detail.text
      setInputMessage(quotedText)
      // フォーカスをテキストエリアに移動
      if (textareaRef.current) {
        textareaRef.current.focus()
        // カーソルを末尾に移動
        setTimeout(() => {
          if (textareaRef.current) {
            const length = quotedText.length
            textareaRef.current.setSelectionRange(length, length)
          }
        }, 0)
      }
    }

    window.addEventListener('insert-quoted-text', handleInsertQuotedText as EventListener)
    return () => {
      window.removeEventListener('insert-quoted-text', handleInsertQuotedText as EventListener)
    }
  }, [])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }


  // 重複を避けて全てのメッセージを時系列順に統合
  const allMessages = React.useMemo(() => {
    const messageMap = new Map()
    
    // チャットメッセージを追加
    messages.forEach(msg => {
      messageMap.set(`chat-${msg.id}`, {
        ...msg,
        source: 'chat',
        timestamp: msg.timestamp
      })
    })
    
    // スレッドメッセージを追加（重複チェック）
    threadMessages.forEach(msg => {
      const key = `thread-${msg.id}`
      const timestamp = msg.created_at * 1000
      
      // 同じ内容のチャットメッセージがないかチェック（改善された重複検出）
      const isDuplicate = Array.from(messageMap.values()).some(existingMsg => {
        // 同じroleでない場合は重複ではない
        if (existingMsg.role !== msg.role) return false
        
        // 時間差が15秒以内で、内容が完全一致の場合のみ重複とする
        const timeDiff = Math.abs(existingMsg.timestamp - timestamp)
        const exactMatch = existingMsg.content === msg.content
        
        return timeDiff < 15000 && exactMatch // 15秒以内の差で内容が完全一致の場合は重複
      })
      
      if (!isDuplicate) {
        messageMap.set(key, {
          ...msg,
          source: 'thread',
          timestamp
        })
      }
    })
    
    return Array.from(messageMap.values()).sort((a, b) => a.timestamp - b.timestamp)
  }, [messages, threadMessages])

  return (
    <div className="chat-area">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '15px',
        marginBottom: '10px'
      }}>
        <h3>AIとの相談</h3>
      </div>

      <div className="chat-messages">
        {allMessages.length === 0 ? (
          <div style={{ opacity: 0.7, textAlign: 'center', padding: '20px' }}>
            <p>AIアシスタントと相談を開始してください</p>
            <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
              「返信を作って」「〜を調べて」「〜を追加して」などの指示で返信エリアを更新できます
            </p>
          </div>
        ) : (
          allMessages.map((message) => {
            const uniqueKey = `${message.source}-${message.id}`
            
            return (
              <div key={uniqueKey} className={`message ${message.role}`}>
                <div className="message-role">
                  {message.role === 'user' ? 'あなた' : 'AI'}
                  <span style={{ marginLeft: '10px', fontSize: '0.8em' }}>
                    {formatTime(message.timestamp)}
                  </span>
                  {message.source === 'chat' && message.isCommand && (
                    <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#646cff' }}>
                      📝 返信更新
                    </span>
                  )}
                </div>
                <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </div>
              </div>
            )
          })
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="message-role">AI</div>
            <div className="message-content loading">
              {loadingMessage}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="AIに相談したい内容を入力してください..."
          disabled={isLoading}
          style={{
            minHeight: '40px',
            maxHeight: '144px', // 6行分
            resize: 'none',
            overflowY: 'auto'
          }}
        />
        <button onClick={handleSend} disabled={!inputMessage.trim() || isLoading}>
          {isLoading ? '送信中...' : '送信'}
        </button>
      </div>
    </div>
  )
}

export default AIChat