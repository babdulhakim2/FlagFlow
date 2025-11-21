import React, { useState, useEffect } from 'react'

interface MemoryViewerPanelProps {
  onClose: () => void
}

interface Pattern {
  key: string
  type: string
  confidence: number
  success_rate: number
  detection_count: number
  last_seen: string
}

export default function MemoryViewerPanel({ onClose }: MemoryViewerPanelProps) {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const response = await fetch('/api/memory/patterns')
        const data = await response.json()
        setPatterns(data.patterns || [])
      } catch (error) {
        console.error('Failed to fetch patterns:', error)
        // Mock data for demo
        setPatterns([
          {
            key: 'pattern:route:miami-cayman-cyprus',
            type: 'route',
            confidence: 0.89,
            success_rate: 0.92,
            detection_count: 7,
            last_seen: '2024-01-20T10:30:00Z'
          },
          {
            key: 'pattern:structuring:threshold',
            type: 'structuring',
            confidence: 0.85,
            success_rate: 0.88,
            detection_count: 15,
            last_seen: '2024-01-20T14:15:00Z'
          },
          {
            key: 'pattern:entity:shell_corp',
            type: 'entity',
            confidence: 0.78,
            success_rate: 0.82,
            detection_count: 3,
            last_seen: '2024-01-19T16:45:00Z'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPatterns()
  }, [])

  return (
    <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg border max-w-md z-40">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold">Redis Memory</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="mb-4">
          <h4 className="font-semibold text-sm text-gray-600 mb-2">Learned Patterns</h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              No patterns learned yet
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map((pattern, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-800">{pattern.type.toUpperCase()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      pattern.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      pattern.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(pattern.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <div>Success Rate: {(pattern.success_rate * 100).toFixed(0)}%</div>
                    <div>Detections: {pattern.detection_count}</div>
                    <div>Last Seen: {new Date(pattern.last_seen).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <h4 className="font-semibold text-sm text-gray-600 mb-2">Performance Metrics</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Investigation Speed:</span>
              <span className="text-green-600 font-medium">+60% faster</span>
            </div>
            <div className="flex justify-between">
              <span>False Positives:</span>
              <span className="text-green-600 font-medium">-40% reduction</span>
            </div>
            <div className="flex justify-between">
              <span>Pattern Accuracy:</span>
              <span className="text-blue-600 font-medium">94% match rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
