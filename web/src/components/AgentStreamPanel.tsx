import React, { useMemo } from 'react'

type StreamMessage = {
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

interface AgentStreamPanelProps { message?: StreamMessage }

const AgentStreamPanel: React.FC<AgentStreamPanelProps> = ({ message }) => {
  const view = useMemo(() => {
    if (!message) return { title: 'Waiting…', desc: 'No events yet', color: '#64748b' }
    const m = message
    // Hide/init
    if ((m as any).subtype === 'init' || (m as any).data?.subtype === 'init') {
      return { title: 'Initializing…', desc: 'Preparing agents', color: '#64748b' }
    }
    if (m.type === 'spawn_agent') {
      return { title: 'Spawn Agent', desc: `${m.agentType} from ${m.parentId || 'orchestrator'}`, color: '#1e3a8a' }
    }
    if (m.type === 'agent_update') {
      const findings = m.findings && m.findings.length ? ` • ${m.findings[0]}` : ''
      const risk = m.riskLevel ? ` • risk: ${m.riskLevel}` : ''
      return { title: 'Agent Update', desc: `${m.agentId} • ${m.status || ''}${findings}${risk}`.trim(), color: '#059669' }
    }
    if (m.type === 'status') {
      return { title: 'Status', desc: m.message || '', color: '#334155' }
    }
    if (m.type === 'risk_update') {
      return { title: 'Risk Update', desc: m.riskLevel || '', color: '#dc2626' }
    }
    if (m.type === 'map_data') {
      return { title: 'Map Data', desc: 'Route visualization updated', color: '#7c3aed' }
    }
    if (m.type === 'learning_update') {
      return { title: 'Memory', desc: m.message || 'Patterns stored in Redis', color: '#8b5cf6' }
    }
    if (m.type === 'complete') {
      return { title: 'Complete', desc: 'Investigation finished', color: '#059669' }
    }
    if ((m as any).content && Array.isArray((m as any).content)) {
      const content = (m as any).content
      const first = content[0]
      // Tool use
      if (first?.id && first?.name) {
        const name = String(first.name)
        const input = first.input || {}
        if (name === 'Task') {
          const sub = input.subagent_type || 'agent'
          const desc = input.description || 'Running specialized agent'
          return { title: `Task • ${sub}`, desc, color: '#1e3a8a' }
        }
        if (name === 'WebSearch') {
          const q = input.query || ''
          return { title: 'Web Search', desc: q ? String(q).slice(0, 140) : 'Searching the web', color: '#0ea5e9' }
        }
        if (name === 'TodoWrite') {
          const todos = Array.isArray(input.todos) ? input.todos : []
          const total = todos.length
          const done = todos.filter((t: any) => t.status === 'completed').length
          const active = todos.filter((t: any) => t.status === 'in_progress').length
          return { title: 'Task Planning', desc: `${done}/${total} completed • ${active} active`, color: '#f59e0b' }
        }
        return { title: name, desc: input.prompt ? String(input.prompt).slice(0, 120) : 'Tool invoked', color: '#334155' }
      }
      // Tool result
      if (first?.tool_use_id) {
        let preview = ''
        if (Array.isArray(first.content)) {
          const textItem = first.content.find((c: any) => c?.type === 'text')
          preview = textItem?.text || ''
        } else if (typeof first.content === 'string') {
          preview = first.content
        }
        const isErr = Boolean(first.is_error)
        return { title: isErr ? 'Tool Error' : 'Tool Result', desc: preview ? String(preview).slice(0, 160) : (isErr ? 'Tool reported an error' : 'Completed'), color: isErr ? '#dc2626' : '#1e3a8a' }
      }
      // Plain text content
      if (first?.text) {
        return { title: 'Agent', desc: String(first.text).slice(0, 140), color: '#0ea5e9' }
      }
    }
    return { title: 'Event', desc: m.type, color: '#64748b' }
  }, [message])

  return (
    <div className="pointer-events-none" style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        className="pointer-events-auto rounded-xl shadow-lg border bg-white px-4 py-3"
        style={{
          minWidth: 320,
          maxWidth: 560,
          borderColor: `${view.color}30`,
          background: `linear-gradient(135deg, ${view.color}10 0%, ${view.color}05 100%)`,
        }}
      >
        <div className="text-sm font-semibold" style={{ color: view.color }}>{view.title}</div>
        <div className="text-xs text-gray-700 mt-1">{view.desc}</div>
      </div>
    </div>
  )
}

export default AgentStreamPanel
