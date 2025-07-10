export interface EditInstruction {
  type: 'specific' | 'general'
  original?: string
  replacement?: string
  action: 'replace' | 'delete' | 'style' | 'general'
}

export interface CommandResult {
  isCommand: boolean
  action: 'create' | 'append' | 'modify' | 'remove' | 'research' | 'edit' | 'chat'
  content?: string
  target?: string
  editInstruction?: EditInstruction
  needsConfirmation?: boolean
}

// 編集指示を検出・分析する関数
export function parseEditInstruction(message: string): EditInstruction | null {
  const lowerMessage = message.toLowerCase().trim()
  
  // 明確な置換指示のパターン
  const replacePatterns = [
    /(.+?)を(.+?)に(変更|修正|置き換え|替え|直し)て/,
    /(.+?)から(.+?)に(変更|修正|置き換え|替え|直し)て/,
    /(.+?)を(.+?)にして/,
    /(.+?)の部分を(.+?)にして/
  ]
  
  for (const pattern of replacePatterns) {
    const match = message.match(pattern)
    if (match) {
      return {
        type: 'specific',
        original: match[1].trim(),
        replacement: match[2].trim(),
        action: 'replace'
      }
    }
  }
  
  // 削除指示のパターン
  const deletePatterns = [
    /(.+?)を(削除|消去|取り除い|除い|なくし)て/,
    /(.+?)は(いらない|不要|削除)$/,
    /(.+?)の部分を(削除|消し)て/
  ]
  
  for (const pattern of deletePatterns) {
    const match = message.match(pattern)
    if (match) {
      return {
        type: 'specific',
        original: match[1].trim(),
        action: 'delete'
      }
    }
  }
  
  // 曖昧なスタイル変更指示
  const stylePatterns = [
    /(もっと|より)(丁寧|カジュアル|フォーマル|親しみやすく|礼儀正しく)/,
    /(短く|長く|簡潔に|詳しく)/,
    /(優しく|厳しく|明るく|落ち着い)/
  ]
  
  for (const pattern of stylePatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      return {
        type: 'general',
        action: 'style'
      }
    }
  }
  
  // 一般的な編集指示
  const generalEditPatterns = [
    /(編集|修正|直し|改善|良く|ブラッシュアップ)して/,
    /(書き直し|リライト)て/,
    /文章を(整え|調整)て/
  ]
  
  for (const pattern of generalEditPatterns) {
    if (lowerMessage.match(pattern)) {
      return {
        type: 'general',
        action: 'general'
      }
    }
  }
  
  return null
}

export function parseCommand(message: string, currentReply: string): CommandResult {
  const lowerMessage = message.toLowerCase().trim()
  
  // 返信作成コマンド
  if (
    lowerMessage.includes('返信を作って') ||
    lowerMessage.includes('返事を作って') ||
    lowerMessage.includes('返信作って') ||
    lowerMessage.includes('返事作って') ||
    lowerMessage.includes('返信作成') ||
    lowerMessage.includes('返事作成') ||
    lowerMessage.includes('返信をください') ||
    lowerMessage.includes('返事をください')
  ) {
    return {
      isCommand: true,
      action: 'create',
      content: message
    }
  }
  
  // 追加コマンド
  if (
    lowerMessage.includes('追加して') ||
    lowerMessage.includes('付け加えて') ||
    lowerMessage.includes('含めて') ||
    lowerMessage.includes('入れて') ||
    lowerMessage.includes('を返信に') ||
    lowerMessage.includes('を返事に')
  ) {
    return {
      isCommand: true,
      action: 'append',
      content: message
    }
  }
  
  // 編集指示をチェック
  const editInstruction = parseEditInstruction(message)
  if (editInstruction) {
    return {
      isCommand: true,
      action: 'edit',
      content: message,
      editInstruction,
      needsConfirmation: editInstruction.type === 'general'
    }
  }
  
  // 従来の修正コマンド（下位互換）
  if (
    lowerMessage.includes('修正して') ||
    lowerMessage.includes('変更して') ||
    lowerMessage.includes('直して')
  ) {
    return {
      isCommand: true,
      action: 'modify',
      content: message
    }
  }
  
  // 削除コマンド
  if (
    lowerMessage.includes('削除して') ||
    lowerMessage.includes('消して') ||
    lowerMessage.includes('取り除いて') ||
    lowerMessage.includes('除いて') ||
    lowerMessage.includes('なくして') ||
    lowerMessage.includes('省いて')
  ) {
    return {
      isCommand: true,
      action: 'remove',
      content: message
    }
  }
  
  // 調査コマンド
  if (
    lowerMessage.includes('調べて') ||
    lowerMessage.includes('検索して') ||
    lowerMessage.includes('情報を') ||
    lowerMessage.includes('について教えて') ||
    lowerMessage.includes('について調査')
  ) {
    return {
      isCommand: true,
      action: 'research',
      content: message
    }
  }
  
  // 通常のチャット
  return {
    isCommand: false,
    action: 'chat',
    content: message
  }
}

export function generateSystemPrompt(command: CommandResult, currentReply: string): string {
  const basePrompt = "あなたは日本語でチャットの返事を書くのを手伝うアシスタントです。"
  const readabilityInstruction = "\n\n【重要な書式指定】\n- 返信は読みやすさを重視し、適度に改行を入れてください\n- 長い文章は意味の区切りで改行し、チャット画面で見やすくしてください\n- 1つの段落が長すぎる場合は、複数の段落に分けてください\n- 箇条書きや番号付きリストも積極的に活用してください"
  
  // OpenAI Assistants APIはスレッド内で自動的に会話履歴を保持するため、手動での履歴送信は不要
  
  switch (command.action) {
    case 'create':
      const contextInfo = currentReply ? `\n\n参考情報: ${currentReply}` : ''
      return `${basePrompt}${readabilityInstruction}\n\nユーザーからの要求に基づいて、適切で丁寧な返信を作成してください。作成した返信のみを出力してください。\n\n要求: ${command.content}${contextInfo}`
    
    case 'append':
      return `${basePrompt}${readabilityInstruction}\n\n現在の返信: "${currentReply}"\n\nユーザーの要求に基づいて、上記の返信に内容を追加してください。追加後の完全な返信を出力してください。\n\n要求: ${command.content}`
    
    case 'edit':
      if (command.editInstruction) {
        const instruction = command.editInstruction
        
        if (instruction.type === 'specific') {
          if (instruction.action === 'replace') {
            return `現在の返信: "${currentReply}"\n\n上記の返信で"${instruction.original}"を"${instruction.replacement}"に置き換えてください。置き換え後の完全な返信のみを出力してください。`
          } else if (instruction.action === 'delete') {
            return `現在の返信: "${currentReply}"\n\n上記の返信から"${instruction.original}"を削除してください。削除後の完全な返信のみを出力してください。`
          }
        } else if (instruction.type === 'general') {
          return `${readabilityInstruction}\n\n現在の返信: "${currentReply}"\n\nユーザーの要求: "${command.content}"\n\n上記の要求に基づいて返信を編集してください。編集後の完全な返信のみを出力してください。`
        }
      }
      return `${basePrompt}${readabilityInstruction}\n\n現在の返信: "${currentReply}"\n\nユーザーの要求に基づいて、上記の返信を修正してください。修正後の完全な返信を出力してください。\n\n要求: ${command.content}`
    
    case 'modify':
      return `${basePrompt}${readabilityInstruction}\n\n現在の返信: "${currentReply}"\n\nユーザーの要求に基づいて、上記の返信を修正してください。修正後の完全な返信を出力してください。\n\n要求: ${command.content}`
    
    case 'remove':
      return `${basePrompt}\n\n現在の返信: "${currentReply}"\n\nユーザーの要求に基づいて、上記の返信から指定された部分を削除してください。削除後の完全な返信を出力してください。\n\n要求: ${command.content}`
    
    case 'research':
      return `${basePrompt}${readabilityInstruction}\n\nユーザーの要求について調査し、情報を提供してください。その後、その情報を基に返信を作成することを提案してください。\n\n要求: ${command.content}`
    
    case 'chat':
    default:
      return `${basePrompt}\n\nユーザーと会話をして、最適な返信を作成するための相談に乗ってください。必要に応じて質問をしたり、提案をしたりしてください。\n\nユーザーのメッセージ: ${command.content}`
  }
}