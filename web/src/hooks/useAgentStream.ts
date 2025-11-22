import { useState, useCallback } from 'react'

interface StreamMessage {
  type: string
  agentType?: string
  parentId?: string
  agentId?: string
  status?: string
  findings?: string[]
  riskLevel?: string
  data?: any
  message?: string
}

export const useAgentStream = () => {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const startStream = useCallback(async (payload: { type: string; transactions?: any[]; context?: any; prompt?: string }) => {
    setIsStreaming(true)
    setMessages([])

    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '')
      const endpoint = `${base}/investigate`

      const body = payload.type === 'investigate_with_context'
        ? (payload.prompt ? { prompt: payload.prompt } : { context: payload.context })
        : { transactions: payload.transactions || [] }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              setMessages(prev => [...prev, data])
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
      setMessages(prev => [...prev, {
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }])
    } finally {
      setIsStreaming(false)
    }
  }, [])

  return { messages, isStreaming, startStream }
}
