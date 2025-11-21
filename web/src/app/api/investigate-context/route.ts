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
  const { context = {} } = await request.json().catch(() => ({ context: {} }))
  const { query = '', answers = [], sessionId = '' } = context as { query: string; answers: string[]; sessionId: string }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(send({ type: 'status', message: `Starting investigation: ${query}` }))

      // Decide simple cascade based on context keywords
      const q = query.toLowerCase()
      const text = [q, ...answers.map(a => a.toLowerCase())].join(' ')

      const wantOsint = /(entity|company|beneficiary|owner|shell)/.test(text)
      const wantGeo = /(jurisdiction|country|offshore|geograph|route|corridor|cyprus)/.test(text)
      const wantPattern = /(pattern|structur|typical|unusual|threshold|split|multiple)/.test(text)
      const wantChain = /(btc|eth|usdt|wallet|address|tx|hash|exchange|crypto|chain|bridge|mixer|bc1|0x)/.test(text)

      let delay = 500
      const spawn = (agentType: string) => {
        controller.enqueue(send({ type: 'spawn_agent', agentType, parentId: 'orchestrator' }))
        delay += 350
      }

      if (wantOsint) setTimeout(() => spawn('osint'), delay)
      if (wantGeo) setTimeout(() => spawn('geo'), delay + 200)
      if (wantPattern) setTimeout(() => spawn('pattern'), delay + 400)
      if (wantChain) setTimeout(() => spawn('chain'), delay + 600)

      // A couple of generic updates
      setTimeout(() => {
        controller.enqueue(send({ type: 'agent_update', agentId: 'osint', status: 'collecting', findings: [ 'Beneficiary cross-referenced with company registry' ] }))
      }, delay + 800)

      setTimeout(() => {
        controller.enqueue(send({ type: 'agent_update', agentId: 'geo', status: 'analyzing', findings: [ 'Jurisdiction risk flagged by internal model' ] }))
      }, delay + 1200)

      setTimeout(() => {
        controller.enqueue(send({ type: 'agent_update', agentId: 'pattern', status: 'flagged', findings: [ 'Transaction pattern deviates from baseline' ], riskLevel: 'elevated' }))
      }, delay + 1600)

      if (wantChain) {
        setTimeout(() => {
          controller.enqueue(send({ type: 'agent_update', agentId: 'chain', status: 'tracing', findings: [ 'Outbound to high-risk cluster via bridge' ], riskLevel: 'high' }))
        }, delay + 1800)
      }

      setTimeout(() => {
        controller.enqueue(send({ type: 'status', message: 'Investigation complete' }))
        controller.close()
      }, delay + 2000)
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}
