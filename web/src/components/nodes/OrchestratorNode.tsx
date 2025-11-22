import React from "react";
import { Handle, Position, NodeProps } from "reactflow";

export default function OrchestratorNode({ data }: NodeProps) {
  const getRiskColor = () => {
    switch (data.riskLevel) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case "idle":
        return "⏸";
      case "initializing":
        return "🔄";
      case "analyzing":
        return "🔍";
      case "complete":
        return "✅";
      default:
        return "❓";
    }
  };

  return (
    <div className={"px-4 py-3 shadow-md rounded-md border bg-white border-gray-200 max-w-md"}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555" }}
      />

      <div className="flex items-center gap-2">
        <span className="text-2xl">{getStatusIcon()}</span>
        <div>
          <div className="text-lg font-bold text-gray-900">{data.title || data.label || 'OSINT Investigator'}</div>
          {data.status && (
            <div className="text-xs text-gray-500">{data.status}</div>
          )}
        </div>
      </div>

      {data.input && (
        <div className="mt-2 text-xs text-gray-700">
          <div className="font-semibold mb-0.5">Input</div>
          <div className="line-clamp-3" title={data.input}>{String(data.input)}</div>
        </div>
      )}

      {Array.isArray((data as any).answers) && (data as any).answers.length > 0 && (
        <div className="mt-3 text-xs text-gray-800">
          <div className="font-semibold mb-1">Follow-ups</div>
          <ul className="list-disc list-inside space-y-0.5">
            {(data as any).answers.map((ans: string, idx: number) => (
              <li key={idx}>
                <span className="text-gray-600">{(data as any).questions?.[idx]?.question || `Q${idx + 1}`}:</span>
                <span className="ml-1 text-gray-800">{ans}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.findings && data.findings.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="font-semibold">Findings:</div>
          <ul className="list-disc list-inside">
            {data.findings.slice(0, 3).map((finding: string, i: number) => (
              <li key={i} className="truncate">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.riskLevel && (
        <div className="mt-2">
          <span className="text-xs font-bold uppercase">
            Risk: {data.riskLevel}
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555" }}
      />
    </div>
  );
}
