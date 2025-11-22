export const runtime = 'nodejs'

function sseHeaders() {
  return new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
}

function send(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  const { transactions = [] } = await request.json().catch(() => ({ transactions: [] }))
  const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL

  // Proxy to backend if configured
  if (backend) {
    const upstream = await fetch(`${backend.replace(/\/$/, '')}/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    })
    if (!upstream.body) return new Response('No upstream body', { status: 502 })
    const proxy = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
        controller.close()
      },
    })
    return new Response(proxy, { headers: sseHeaders() })
  }

  // Fallback demo SSE
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(send({ type: 'status', message: `Starting investigation on ${transactions.length} transactions` }))
      setTimeout(() => { controller.enqueue(send({ type: 'spawn_agent', agentType: 'osint', parentId: 'orchestrator' })) }, 500)
      setTimeout(() => { controller.enqueue(send({ type: 'spawn_agent', agentType: 'geo', parentId: 'orchestrator' })) }, 900)
      setTimeout(() => { controller.enqueue(send({ type: 'spawn_agent', agentType: 'pattern', parentId: 'orchestrator' })) }, 1300)
      const txText = JSON.stringify(transactions).toLowerCase()
      const cryptoHint = /(btc|eth|usdt|address|wallet|tx|hash|exchange|crypto|chain|bridge|mixer|bc1|0x)/.test(txText)
      if (cryptoHint) setTimeout(() => { controller.enqueue(send({ type: 'spawn_agent', agentType: 'chain', parentId: 'orchestrator' })) }, 1600)
      setTimeout(() => { controller.enqueue(send({ type: 'agent_update', agentId: 'osint', status: 'collecting', findings: [ 'Entity mentions found in public records' ] })) }, 1700)
      setTimeout(() => { controller.enqueue(send({ type: 'agent_update', agentId: 'geo', status: 'analyzing', findings: [ 'Route intersects high-risk corridor' ] })) }, 2100)
      setTimeout(() => { controller.enqueue(send({ type: 'agent_update', agentId: 'pattern', status: 'flagged', findings: [ 'Structuring pattern detected across accounts' ], riskLevel: 'high' })) }, 2500)
      if (cryptoHint) setTimeout(() => { controller.enqueue(send({ type: 'agent_update', agentId: 'chain', status: 'tracing', findings: [ 'Clustered with exchange deposit addresses' ], riskLevel: 'elevated' })) }, 2300)
      setTimeout(() => { controller.enqueue(send({ type: 'status', message: 'Investigation complete' })); controller.close() }, 3000)
    },
  })
  return new Response(stream, { headers: sseHeaders() })
}
