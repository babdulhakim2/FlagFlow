import React from 'react'

interface MapOverlayProps {
  data: any
  onClose: () => void
}

export default function MapOverlay({ data, onClose }: MapOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-3xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Transaction Flow Map</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>High Risk Route Detected:</strong> Miami → Cayman Islands → Cyprus
            <br />
            <em>Classic offshore layering pattern used for money laundering</em>
          </div>
        </div>

        {/* Placeholder for actual map - would integrate Google Maps in real implementation */}
        <div className="h-96 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">Geographic Flow Visualization</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>🏙️ Miami (Origin)</span>
                <span>→</span>
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>🏝️ Cayman Islands</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>🏝️ Cayman Islands</span>
                <span>→</span>
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>🏛️ Cyprus</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>🏛️ Cyprus</span>
                <span>→</span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span>🏙️ Miami (Return)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Risk Indicators</h4>
            <ul className="text-sm space-y-1">
              <li>• Offshore banking secrecy jurisdictions</li>
              <li>• Rapid sequential movements</li>
              <li>• Round-trip pattern detected</li>
              <li>• Multiple shell companies involved</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Geographic Analysis</h4>
            <ul className="text-sm space-y-1">
              <li>• 3 jurisdictions involved</li>
              <li>• 2 offshore financial centers</li>
              <li>• Total distance: ~8,500 miles</li>
              <li>• Pattern matches ML typology #47</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}