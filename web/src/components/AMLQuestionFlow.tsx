import React, { useState, useEffect } from "react";
import { ChevronRight, Check, Clock, ArrowRight, X, Shield } from "lucide-react";

interface FollowUpQuestion {
  question: string;
  options: string[];
}

interface AMLSessionState {
  stage: 0 | 1 | 2 | 3 | 4;
  initialQuery: string;
  questions: FollowUpQuestion[];
  answers: string[];
  currentQuestionIndex: number;
  sessionId: string;
}

interface AMLQuestionFlowProps {
  session: AMLSessionState;
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
  onClose?: () => void;
  onLaunchInvestigation?: () => void;
}

const AMLQuestionFlow: React.FC<AMLQuestionFlowProps> = ({
  session,
  onAnswer,
  isLoading = false,
  onClose,
  onLaunchInvestigation,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAnswer, setCustomAnswer] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(true);

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;

  // Handle smooth transitions when question changes
  useEffect(() => {
    setQuestionVisible(false);
    const timer = setTimeout(() => {
      setQuestionVisible(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [session.currentQuestionIndex]);

  if (!currentQuestion) {
    return null;
  }

  const handleAnswer = (answer: string) => {
    setIsTransitioning(true);
    setQuestionVisible(false);

    // Show transition animation
    setTimeout(() => {
      onAnswer(answer);
      setShowCustomInput(false);
      setCustomAnswer("");
      setIsTransitioning(false);

      // If this was the last question, show investigation launch option
      if (isLastQuestion && onLaunchInvestigation) {
        setTimeout(() => {
          onLaunchInvestigation();
        }, 500);
      }
    }, 300);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAnswer.trim()) {
      handleAnswer(customAnswer.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Context summary at top */}
      <div className="mb-3 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-red-600" />
          <span className="text-xs font-semibold text-red-800">AML Investigation Context</span>
        </div>
        <p className="text-xs text-red-700 font-medium">"{session.initialQuery}"</p>
        {session.answers.length > 0 && (
          <div className="mt-1 text-[11px] text-red-600">
            {session.answers.length} context question{session.answers.length > 1 ? 's' : ''} answered
          </div>
        )}
      </div>

      {/* Question card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
        <div className="p-4">
          {isTransitioning || isLoading ? (
            <div className="text-center py-6 transition-all duration-300 ease-in-out">
              <div className="relative inline-block">
                <Clock className="w-6 h-6 text-red-600 animate-spin" />
                <div className="absolute inset-0 rounded-full border border-red-200 animate-ping"></div>
              </div>
              <p className="text-gray-700 font-medium text-sm mt-3 mb-1">
                Processing your response...
              </p>
              <p className="text-gray-500 text-xs">
                {isLastQuestion ? 'Preparing investigation launch' : 'Preparing next question'}
              </p>
            </div>
          ) : (
            <div className={`transition-all duration-300 ease-in-out ${
              questionVisible
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform translate-y-2'
            }`}>
              {/* Question header */}
              <div className="mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800">
                        Question {session.currentQuestionIndex + 1} of {session.questions.length}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                      {currentQuestion.question}
                    </h3>
                    <div className="w-10 h-[3px] bg-gradient-to-r from-red-600 to-orange-600 rounded-full"></div>
                  </div>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0"
                      title="Cancel investigation setup"
                    >
                      <X className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* Answer options */}
              <div className="space-y-2">
                {/* Primary options */}
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className="text-left p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-25 hover:from-red-50 hover:to-orange-50 border border-gray-200 hover:border-red-300 transition-all duration-200 group hover:shadow-md"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: questionVisible ? 'slideInFromRight 0.4s ease-out both' : 'none'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 text-sm font-medium leading-relaxed pr-4">
                          {option}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Skip option for this question */}
                <div className="flex justify-end -mt-1">
                  <button
                    onClick={() => handleAnswer('[SKIP]')}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    title="Skip this question"
                  >
                    Skip this question
                  </button>
                </div>

                {/* Custom answer option */}
                <div className="pt-3 border-t border-gray-100">
                  {!showCustomInput ? (
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 transition-all duration-200 group hover:shadow-sm"
                      style={{
                        animationDelay: `${currentQuestion.options.length * 100}ms`,
                        animation: questionVisible ? 'slideInFromRight 0.4s ease-out both' : 'none'
                      }}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
                          <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-800 text-sm">
                            Provide specific details
                          </div>
                          <div className="text-blue-600 text-xs">
                            Share additional context or custom response
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <form onSubmit={handleCustomSubmit} className="space-y-4">
                      <div className="relative">
                        <textarea
                          value={customAnswer}
                          onChange={(e) => setCustomAnswer(e.target.value)}
                          placeholder="Enter your specific details here..."
                          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all duration-200 text-sm"
                          rows={3}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={!customAnswer.trim()}
                          className="flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium hover:shadow-sm text-sm"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Submit Response
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomAnswer("");
                          }}
                          className="px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Progress indicator */}
              {session.questions.length > 1 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Question {session.currentQuestionIndex + 1} of {session.questions.length}</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: session.questions.length }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx <= session.currentQuestionIndex
                              ? 'bg-red-600'
                              : idx === session.currentQuestionIndex + 1
                              ? 'bg-red-200'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {isLastQuestion && (
                    <p className="text-[11px] text-red-600 mt-2 font-medium">
                      Final question - agents will launch after this response
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AMLQuestionFlow;
