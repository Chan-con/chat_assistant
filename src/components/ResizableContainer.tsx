import React, { useState, useRef, useCallback } from 'react'

interface ResizableContainerProps {
  children: [React.ReactNode, React.ReactNode]
  initialRatio?: number
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({ 
  children, 
  initialRatio = 0.4 
}) => {
  const [ratio, setRatio] = useState(initialRatio)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const newRatio = Math.max(0.2, Math.min(0.8, (e.clientY - rect.top) / rect.height))
    setRatio(newRatio)
    
    // 比率を保存
    window.electronAPI.saveRatio(newRatio)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 保存された比率を読み込み
  React.useEffect(() => {
    const loadSavedRatio = async () => {
      try {
        const result = await window.electronAPI.getSavedRatio()
        if (result.success) {
          setRatio(result.ratio)
        }
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to load saved ratio:', error)
        setIsInitialized(true)
      }
    }
    
    loadSavedRatio()
  }, [])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!isInitialized) {
    return <div className="resizable-container">Loading...</div>
  }

  return (
    <div ref={containerRef} className="resizable-container">
      <div 
        className="reply-section" 
        style={{ height: `${ratio * 100}%` }}
      >
        {children[0]}
      </div>
      
      <div 
        className="resize-handle"
        onMouseDown={handleMouseDown}
        style={{ 
          backgroundColor: isDragging ? 'rgba(100, 108, 255, 0.5)' : undefined 
        }}
      />
      
      <div 
        className="chat-section" 
        style={{ height: `${(1 - ratio) * 100}%` }}
      >
        {children[1]}
      </div>
    </div>
  )
}

export default ResizableContainer