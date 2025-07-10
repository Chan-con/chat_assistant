import React from 'react'

interface EditConfirmationModalProps {
  isOpen: boolean
  originalText: string
  editedText: string
  onConfirm: () => void
  onCancel: () => void
  editInstruction: string
}

const EditConfirmationModal: React.FC<EditConfirmationModalProps> = ({
  isOpen,
  originalText,
  editedText,
  onConfirm,
  onCancel,
  editInstruction
}) => {
  if (!isOpen) return null

  return (
    <div className="settings-overlay">
      <div className="settings-modal" style={{ width: '600px' }}>
        <div className="settings-header">
          <h2>編集確認</h2>
          <button className="close-button" onClick={onCancel}>
            ×
          </button>
        </div>
        
        <div className="settings-form">
          <div className="form-group">
            <label>編集指示:</label>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.125)'
            }}>
              {editInstruction}
            </div>
          </div>

          <div className="form-group">
            <label>現在の返信:</label>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.125)',
              maxHeight: '150px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {originalText}
            </div>
          </div>

          <div className="form-group">
            <label>編集後の返信:</label>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#1a3d1a', 
              borderRadius: '8px',
              border: '1px solid #22c55e',
              maxHeight: '150px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {editedText}
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            margin: '20px 0', 
            fontSize: '1.1em',
            color: '#646cff'
          }}>
            このように変更しますか？
          </div>

          <div className="form-actions">
            <button 
              className="primary-button" 
              onClick={onConfirm}
            >
              はい、変更する
            </button>
            <button 
              onClick={onCancel}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditConfirmationModal