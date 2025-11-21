import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { z } from 'zod'
import { generateQuestionsWithGemini } from '@/utils/ai'

// zod schema for request validation
const requestSchema = z.object({
  question: z.string().min(1, 'Question is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question } = requestSchema.parse(body)

    const questions = await generateQuestionsWithGemini(question)
    return NextResponse.json({
      session_id: `aml_${Date.now()}`,
      questions,
      initial_query: question,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error processing follow-up request:', error)
    return NextResponse.json(
      { error: 'Failed to process research question' },
      { status: 500 }
    )
  }
}
