import React, { useState, useRef } from 'react'

interface ReplyAreaProps {
  content: string
  onChange: (content: string) => void
  onCopy: () => void
  onClear: () => void
}

const ReplyArea: React.FC<ReplyAreaProps> = ({ 
  content, 
  onChange, 
  onCopy, 
  onClear
}) => {
  const [editContent, setEditContent] = useState(content)
  const [selectedText, setSelectedText] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const handleChange = (newContent: string) => {
    setEditContent(newContent)
    onChange(newContent)
  }

  React.useEffect(() => {
    setEditContent(content)
  }, [content])

  // テキスト選択を検出
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const selected = selection.toString().trim()
      if (selected) {
        setSelectedText(selected)
      }
    } else {
      setSelectedText('')
    }
  }

  // 選択テキストでチャットを開始
  const handleQuoteSelected = () => {
    if (selectedText) {
      const quotedText = `「${selectedText}」について`
      // チャット入力エリアに挿入するためのイベントを発火
      window.dispatchEvent(new CustomEvent('insert-quoted-text', { 
        detail: { text: quotedText } 
      }))
      setSelectedText('')
      window.getSelection()?.removeAllRanges()
    }
  }

  return (
    <div className="reply-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>返信文</h3>
        <div className="reply-actions">
          <button onClick={onCopy} disabled={!content}>
            コピー
          </button>
          <button onClick={onClear} disabled={!content}>
            クリア
          </button>
        </div>
      </div>
      
      {selectedText && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#2a2a3a', 
          borderRadius: '8px', 
          marginTop: '10px',
          border: '1px solid #646cff'
        }}>
          <div style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '8px' }}>
            選択中: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>
          <button 
            onClick={handleQuoteSelected}
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.9em',
              backgroundColor: '#646cff',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            この部分について相談
          </button>
        </div>
      )}
      
      <div style={{ position: 'relative', height: 'calc(100% - 80px)' }}>
        <textarea
          value={editContent}
          onChange={(e) => handleChange(e.target.value)}
          className="reply-content editable"
          style={{ 
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '1em',
            lineHeight: '1.6',
            height: '100%',
            width: '100%',
            minHeight: '100px'
          }}
          placeholder="返信文がここに表示されます。AIとの相談を通じて作成してください。"
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
        />
      </div>
    </div>
  )
}

export default ReplyArea