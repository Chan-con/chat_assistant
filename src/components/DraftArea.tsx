import React from 'react'

interface Action {
  key: string
  label: string
  description: string
}

interface DraftAreaProps {
  content: string
  onChange: (content: string) => void
  onSendMessage: (action: string) => void
  actions: Action[]
  isLoading: boolean
}

const DraftArea: React.FC<DraftAreaProps> = ({ 
  content, 
  onChange, 
  onSendMessage, 
  actions, 
  isLoading 
}) => {
  return (
    <div className="input-area">
      <h3>下書き</h3>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="返事の内容を大まかに入力してください..."
        disabled={isLoading}
      />
      <div className="actions">
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={() => onSendMessage(action.key)}
            disabled={isLoading || !content.trim()}
            title={action.description}
          >
            {isLoading ? '処理中...' : action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DraftArea