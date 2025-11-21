import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Clock,
  X,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface AMLChatInputProps {
  onSendQuery: (query: string) => void;
  disabled?: boolean;
}

const AMLChatInput: React.FC<AMLChatInputProps> = ({
  onSendQuery,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // AML-specific history suggestions
  const amlHistory = [
    "Wire transfer $50,000 to high-risk jurisdiction",
    "Multiple cash deposits under $10,000 threshold",
    "Customer profile inconsistent with transaction patterns",
    "Cross-border transaction to shell company",
    "Rapid movement of funds through multiple accounts",
    "High-value cryptocurrency exchange activity",
    "USDT 40,000 sent to new wallet on Tron",
    "ETH transfer to mixing service from new address",
    "BTC transfer to wallet bc1q6v56da8y8nhrh8lpfuy8cpk9g27g4gxgkce0aj",
    "BTC transfer to wallet bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
    "BTC activity involving wallet 1AjZPMsnmpdK2Rv9KQNjSMGJ1nfnDJkLaq",
    "Trade-based money laundering indicators detected",
    "Suspicious structuring activity across branches",
  ];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSendQuery(query);
      setQuery("");
      setShowHistory(false);
    }
  };

  const handleHistorySelect = (historyItem: string) => {
    setQuery(historyItem);
    setShowHistory(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="w-full max-w-3xl mx-auto relative">
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="relative flex-grow bg-white rounded-full border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Shield className="h-6 w-6 text-red-600" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe suspicious transaction or AML concern..."
              disabled={disabled}
              className="block w-full pl-12 pr-14 py-4 text-base font-medium text-gray-900 bg-transparent rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* History toggle button */}
            {!disabled && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="absolute inset-y-0 right-12 flex items-center hover:scale-105 transition-transform"
              >
                <Clock
                  className={`h-5 w-5 ${
                    showHistory
                      ? "text-red-600 animate-pulse"
                      : "text-gray-400 hover:text-red-600"
                  } transition-all duration-300`}
                />
              </button>
            )}

            {/* Clear input button */}
            {query && !disabled && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-4 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>
        </form>

        {/* Quick action buttons */}
        <div className="flex justify-center mt-4 space-x-3">
          <button
            onClick={() => handleHistorySelect("Wire transfer $50,000 to high-risk jurisdiction associated with wallet bc1q6v56da8y8nhrh8lpfuy8cpk9g27g4gxgkce0aj")}
            className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
            disabled={disabled}
          >
            🌍 High-Risk Transfer
          </button>
          <button
            onClick={() => handleHistorySelect("Multiple cash deposits under $10,000 threshold associated with wallet bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h")}
            className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors border border-orange-200"
            disabled={disabled}
          >
            📊 Structuring Activity
          </button>
          <button
            onClick={() => handleHistorySelect("Cross-border transaction to shell company associated with wallet 1AjZPMsnmpdK2Rv9KQNjSMGJ1nfnDJkLaq")}
            className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium hover:bg-yellow-100 transition-colors border border-yellow-200"
            disabled={disabled}
          >
            🏢 Shell Company
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && !disabled && (
        <div
          className="absolute top-full left-0 right-0 mt-3 mx-auto max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slideInFromBottom z-50"
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Common AML Scenarios
              </h3>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1.5 rounded-full hover:bg-white/60 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600 hover:text-gray-800" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <ul>
              {amlHistory.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleHistorySelect(item)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center group transition-all duration-200 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-gray-800 font-medium group-hover:text-gray-900 leading-relaxed">
                      {item}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMLChatInput;
