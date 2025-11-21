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
    <div
      className={`px-4 py-2 shadow-md rounded-md border-2 ${getRiskColor()} bg-opacity-20 border-opacity-50`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555" }}
      />

      <div className="flex items-center gap-2">
        <span className="text-2xl">{getStatusIcon()}</span>
        <div>
          <div className="text-lg font-bold">Orchestrator</div>
          <div className="text-sm text-gray-600">{data.status}</div>
        </div>
      </div>

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