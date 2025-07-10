import React, { useState } from 'react'

interface SetupModalProps {
  onSetupComplete: (apiKey: string) => void
  isLoading: boolean
  error: string
}

const SetupModal: React.FC<SetupModalProps> = ({ onSetupComplete, isLoading, error }) => {
  const [apiKey, setApiKey] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      onSetupComplete(apiKey.trim())
    }
  }

  return (
    <div className="setup-overlay">
      <div className="setup-modal">
        <h2>Chat Assistant セットアップ</h2>
        <form onSubmit={handleSubmit} className="setup-form">
          <div>
            <label htmlFor="apiKey">OpenAI API キー:</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="error">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? '設定中...' : 'セットアップ開始'}
          </button>
          
          <div style={{ fontSize: '0.9em', opacity: 0.7, textAlign: 'center' }}>
            OpenAI API キーは安全に保存され、外部に送信されません
          </div>
        </form>
      </div>
    </div>
  )
}

export default SetupModal