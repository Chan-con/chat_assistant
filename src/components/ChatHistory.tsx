import React, { useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: number
}

interface ChatHistoryProps {
  messages: Message[]
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('ja-JP')
  }

  return (
    <div className="chat-history" ref={scrollRef}>
      <h3>会話履歴</h3>
      {messages.length === 0 ? (
        <div style={{ opacity: 0.7, textAlign: 'center', marginTop: '20px' }}>
          まだ会話がありません
        </div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-role">
              {message.role === 'user' ? 'ユーザー' : 'Assistant'}
              <span style={{ marginLeft: '10px', fontSize: '0.8em' }}>
                {formatDate(message.created_at)}
              </span>
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default ChatHistory