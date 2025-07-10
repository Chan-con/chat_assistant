import React, { useState, useEffect } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onApiKeyUpdate: (apiKey: string) => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onApiKeyUpdate }) => {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess('')
      setApiKey('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('APIキーを入力してください')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await window.electronAPI.setApiKey(apiKey.trim())
      if (result.success) {
        setSuccess('APIキーが更新されました')
        onApiKeyUpdate(apiKey.trim())
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'APIキーの更新に失敗しました')
      }
    } catch (err: any) {
      setError(err.message || '予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearApiKey = async () => {
    if (window.confirm('APIキーをクリアしますか？アプリケーションが再起動します。')) {
      try {
        await window.electronAPI.clearApiKey()
        setSuccess('APIキーがクリアされました')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (err: any) {
        setError(err.message || 'APIキーのクリアに失敗しました')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>設定</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="apiKey">OpenAI API キー:</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="新しいAPIキーを入力..."
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success">
              {success}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isLoading || !apiKey.trim()}
              className="primary-button"
            >
              {isLoading ? '更新中...' : 'APIキーを更新'}
            </button>
            
            <button 
              type="button" 
              onClick={handleClearApiKey}
              disabled={isLoading}
              className="danger-button"
            >
              APIキーをクリア
            </button>
          </div>
          
          <div className="settings-info">
            <p>APIキーは安全に暗号化して保存されます</p>
            <p>変更後はアプリケーションが自動的に再初期化されます</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SettingsModal