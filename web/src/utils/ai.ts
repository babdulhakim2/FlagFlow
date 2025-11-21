import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

// Lazy init so build works without key
let genAI: GoogleGenerativeAI | null = null
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  } catch {
    genAI = null
  }
}

export interface SimpleQuestion {
  question: string
  options: string[]
}

export async function generateDynamicAMLQuestions(prompt: string): Promise<SimpleQuestion[] | null> {
  if (!genAI) return null

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const geminiPrompt = `
You are an AML and crypto compliance assistant inside an investigation app called FlagFlow.
Your goal is to generate exactly 4 follow-up questions, each with exactly 4 concise answer options, to collect context that helps downstream agents (OSINT, Geo, Pattern, Chain Intelligence) investigate intelligently.

Context from user:
"""
${prompt}
"""

Guidelines:
- Make questions specific and investigative (AML +, when relevant, crypto/Web3).
- Prefer concrete details: counterparty, purpose, typicality, geography, wallet/exchange, chain, token, on/off-ramp.
- If the context suggests crypto, include chain-aware items (wallets, tx hashes, exchange KYC, mixers/bridges, OFAC lists, risk scores).
- Keep options short, mutually distinct, and practical.

Return ONLY a JSON array like:
[
  {"question":"...","options":["...","...","...","..."]},
  {"question":"...","options":["...","...","...","..."]},
  {"question":"...","options":["...","...","...","..."]},
  {"question":"...","options":["...","...","...","..."]}
]
No prose. No markdown. No explanations. Exactly 4 items, each with 4 options.
`

  const result = await model.generateContent(geminiPrompt)
  const text = result.response.text()
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as SimpleQuestion[]
    // Basic validation: 4 questions, 4 options each
    if (!Array.isArray(parsed) || parsed.length !== 4) return null
    if (!parsed.every(q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4)) return null
    return parsed
  } catch {
    return null
  }
}

export function deterministicFallback(query: string): SimpleQuestion[] {
  const q = query.toLowerCase()
  // Crypto-aware defaults layered on top of AML
  if (["btc","eth","usdt","wallet","address","tx","hash","exchange","crypto","chain","bridge","mixer"].some(k => q.includes(k))) {
    return [
      {
        question: "Which crypto context best matches this case?",
        options: [
          "CEX withdrawal to new wallet",
          "P2P transfer between personal wallets",
          "Bridge/mixer interaction detected",
          "DeFi protocol cash-out",
        ],
      },
      {
        question: "What identifiers can you provide?",
        options: [
          "Wallet address",
          "Transaction hash",
          "Exchange account ID",
          "No identifiers available",
        ],
      },
      {
        question: "Is the value typical for this customer?",
        options: [
          "Yes, within historical range",
          "No, significantly higher",
          "No, significantly lower",
          "No history available",
        ],
      },
      {
        question: "What is the stated purpose?",
        options: [
          "Business settlement",
          "Investment/Trading",
          "Personal transfer/remittance",
          "Unclear or inconsistent",
        ],
      },
    ]
  }

  // AML non-crypto defaults
  return [
    {
      question: "What type of suspicious activity is indicated?",
      options: ["Unusual patterns","Jurisdictional risk","Customer anomaly","Documentation issues"],
    },
    {
      question: "Is the amount typical for this customer?",
      options: ["Yes, typical","Higher than usual","Lower than usual","No history"],
    },
    {
      question: "Counterparty risk profile?",
      options: ["Known partner","New entity","High-risk entity","Unclear"],
    },
    {
      question: "Geographic considerations?",
      options: ["Low-risk","High-risk destination","High-risk origin","Multi-jurisdiction routing"],
    },
  ]
}

// Public API used by routes: dynamic if possible, fallback otherwise
export async function generateQuestionsWithGemini(prompt: string): Promise<SimpleQuestion[]> {
  try {
    const dynamic = await generateDynamicAMLQuestions(prompt)
    return dynamic ?? deterministicFallback(prompt)
  } catch {
    return deterministicFallback(prompt)
  }
}
