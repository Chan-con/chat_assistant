import React from 'react'

interface SuggestionAreaProps {
  content: string
  isLoading: boolean
}

const SuggestionArea: React.FC<SuggestionAreaProps> = ({ content, isLoading }) => {
  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
    }
  }

  return (
    <div className="output-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>AI提案</h3>
        {content && (
          <button onClick={handleCopy} style={{ padding: '5px 10px', fontSize: '0.8em' }}>
            コピー
          </button>
        )}
      </div>
      <div className={`output-content ${isLoading ? 'loading' : ''}`}>
        {isLoading ? (
          'AIが提案を作成しています...'
        ) : content ? (
          content
        ) : (
          '下書きを入力してアクションを選択してください'
        )}
      </div>
    </div>
  )
}

export default SuggestionArea