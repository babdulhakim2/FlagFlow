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

  const stream = new ReadableStream({
    start(controller) {
      // Kickoff
      controller.enqueue(send({ type: 'status', message: `Starting investigation on ${transactions.length} transactions` }))

      // Spawn a few demo agents (include chain for crypto cases if any hint in transactions)
      setTimeout(() => {
        controller.enqueue(send({ type: 'spawn_agent', agentType: 'osint', parentId: 'orchestrator' }))
      }, 500)

      setTimeout(() => {
        controller.enqueue(send({ type: 'spawn_agent', agentType: 'geo', parentId: 'orchestrator' }))
      }, 900)

      setTimeout(() => {
        controller.enqueue(send({ type: 'spawn_agent', agentType: 'pattern', parentId: 'orchestrator' }))
      }, 1300)

      const txText = JSON.stringify(transactions).toLowerCase()
      const cryptoHint = /(btc|eth|usdt|address|wallet|tx|hash|exchange|crypto|chain|bridge|mixer|bc1|0x)/.test(txText)
      if (cryptoHint) {
        setTimeout(() => {
          controller.enqueue(send({ type: 'spawn_agent', agentType: 'chain', parentId: 'orchestrator' }))
        }, 1600)
      }

      // Agent updates
      setTimeout(() => {
        controller.enqueue(send({ type: 'agent_update', agentId: 'osint', status: 'collecting', findings: [ 'Entity mentions found in public records' ] }))
      }, 1700)

      setTimeout(() => {
        controller.enqueue(send({ type: 'agent_update', agentId: 'geo', status: 'analyzing', findings: [ 'Route intersects high-risk corridor' ] }))
      }, 2100)

      setTimeout(() => {
        controller.enqueue(send({ type: 'agent_update', agentId: 'pattern', status: 'flagged', findings: [ 'Structuring pattern detected across accounts' ], riskLevel: 'high' }))
      }, 2500)

      if (cryptoHint) {
        setTimeout(() => {
          controller.enqueue(send({ type: 'agent_update', agentId: 'chain', status: 'tracing', findings: [ 'Clustered with exchange deposit addresses' ], riskLevel: 'elevated' }))
        }, 2300)
      }

      // Graceful end
      setTimeout(() => {
        controller.enqueue(send({ type: 'status', message: 'Investigation complete' }))
        controller.close()
      }, 3000)
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}
