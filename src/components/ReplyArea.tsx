import React, { useState, useRef } from 'react'

interface ReplyAreaProps {
  content: string
  onChange: (content: string) => void
  onCopy: () => void
  onClear: () => void
  isEditable: boolean
  onToggleEdit: () => void
}

const ReplyArea: React.FC<ReplyAreaProps> = ({ 
  content, 
  onChange, 
  onCopy, 
  onClear, 
  isEditable, 
  onToggleEdit 
}) => {
  const [editContent, setEditContent] = useState(content)
  const [selectedText, setSelectedText] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const handleSave = () => {
    onChange(editContent)
    onToggleEdit()
  }

  const handleCancel = () => {
    setEditContent(content)
    onToggleEdit()
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
        <h3>最終返信</h3>
        <div className="reply-actions">
          {isEditable ? (
            <>
              <button onClick={handleSave}>保存</button>
              <button onClick={handleCancel}>キャンセル</button>
            </>
          ) : (
            <>
              <button onClick={onToggleEdit} disabled={!content}>
                編集
              </button>
              <button onClick={onCopy} disabled={!content}>
                コピー
              </button>
              <button onClick={onClear} disabled={!content}>
                クリア
              </button>
            </>
          )}
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
      
      {isEditable ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="reply-content editable"
          style={{ 
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '1em',
            lineHeight: '1.6',
            height: '100%',
            minHeight: '200px'
          }}
        />
      ) : (
        <div 
          ref={contentRef}
          className="reply-content"
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          style={{ userSelect: 'text', cursor: 'text' }}
        >
          {content || '最終的な返信がここに表示されます。AIとの相談を通じて作成してください。'}
        </div>
      )}
    </div>
  )
}

export default ReplyArea