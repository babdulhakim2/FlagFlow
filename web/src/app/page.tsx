'use client'

import React, { useState } from 'react'
import AMLChatInput from '@/components/AMLChatInput'
import AMLQuestionFlow from '@/components/AMLQuestionFlow'
import InvestigationCanvas from '@/components/InvestigationCanvas'

interface AMLSessionState {
  stage: 0 | 1 | 2 | 3 | 4
  initialQuery: string
  questions: { question: string; options: string[] }[]
  answers: string[]
  currentQuestionIndex: number
  sessionId: string
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'input' | 'questions' | 'investigation'>('input')
  const [session, setSession] = useState<AMLSessionState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInitialQuery = async (query: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query }),
      })

      if (response.ok) {
        const data = await response.json()
        setSession({
          stage: 1,
          initialQuery: query,
          questions: data.questions,
          answers: [],
          currentQuestionIndex: 0,
          sessionId: data.session_id,
        })
        setCurrentView('questions')
      }
    } catch (error) {
      console.error('Error generating questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    if (!session) return

    const newAnswers = [...session.answers, answer]
    const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1

    if (isLastQuestion) {
      // All questions answered, prepare for investigation
      setSession({
        ...session,
        answers: newAnswers,
        stage: 4,
      })
    } else {
      // Move to next question
      setSession({
        ...session,
        answers: newAnswers,
        currentQuestionIndex: session.currentQuestionIndex + 1,
        stage: 2,
      })
    }
  }

  const handleLaunchInvestigation = () => {
    setCurrentView('investigation')
  }

  const handleReset = () => {
    setSession(null)
    setCurrentView('input')
  }

  if (currentView === 'investigation' && session) {
    return (
      <main className="w-full h-screen">
        <InvestigationCanvas
          context={{
            query: session.initialQuery,
            answers: session.answers,
            sessionId: session.sessionId,
            questions: session.questions,
          }}
          onBack={handleReset}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto px-6 py-8 max-w-7xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-red-600">Flag</span>Flow
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered AML Investigation Platform
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {currentView === 'input' && (
          <div className="max-w-7xl w-full mx-auto">
            {/* Input stage */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Describe Your AML Concern
              </h2>
              <p className="text-gray-600">
                Enter details about suspicious financial activity to begin intelligent investigation
              </p>
            </div>

            <div className="flex justify-center">
              <AMLChatInput
                onSendQuery={handleInitialQuery}
                disabled={isLoading}
              />
            </div>

            {isLoading && (
              <div className="text-center mt-8">
                <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-3"></div>
                  <span className="text-gray-700">Generating context questions...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'questions' && session && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Investigation Context
              </h2>
              <p className="text-gray-600">
                Answer these questions to provide context for our AI agents
              </p>
            </div>

            <AMLQuestionFlow
              session={session}
              onAnswer={handleAnswer}
              onClose={handleReset}
              onLaunchInvestigation={handleLaunchInvestigation}
            />
          </div>
        )}
      </div>
    </main>
  )
}
