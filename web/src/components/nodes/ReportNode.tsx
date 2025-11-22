import React from "react";
import { Handle, Position, NodeProps } from "reactflow";

type ReportNodeData = {
  title?: string;
  content: string;
  onRunGeo?: (text: string) => void;
  onDownload?: (text: string) => void;
};

function BoldText({ text }: { text: string }) {
  // naive bold parser for **strong** spans
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return <strong key={i}>{p.slice(2, -2)}</strong>
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

export default function ReportNode({ data }: NodeProps<ReportNodeData>) {
  const handleGeo = () => data.onRunGeo && data.onRunGeo(data.content);
  const handleDownload = () => {
    if (data.onDownload) return data.onDownload(data.content);
    try {
      const blob = new Blob([data.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compliance_report.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const renderLines = (content: string) => {
    const lines = content.split(/\r?\n/)
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <div key={idx} className="text-sm font-semibold text-gray-900 mt-2">
                <BoldText text={line.replace(/^###\s+/, "")} />
              </div>
            )
          }
          if (line.startsWith("## ")) {
            return (
              <div key={idx} className="text-base font-bold text-gray-900 mt-3">
                <BoldText text={line.replace(/^##\s+/, "")} />
              </div>
            )
          }
          if (line.startsWith("- ")) {
            return (
              <div key={idx} className="text-[13px] text-gray-800 pl-4">
                • <BoldText text={line.slice(2)} />
              </div>
            )
          }
          return (
            <div key={idx} className="text-[13px] text-gray-800">
              <BoldText text={line} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="px-5 py-4 shadow-md rounded-lg border bg-white border-gray-200 max-w-2xl max-h-[520px] overflow-auto">
      <Handle type="target" position={Position.Top} style={{ background: "#555" }} />

      <div className="mb-2">
        <div className="text-xl font-bold text-gray-900">{data.title || "OSINT Report"}</div>
      </div>

      <div className="text-xs leading-relaxed max-h-72 overflow-auto border border-gray-100 rounded p-3 bg-gray-50">
        {renderLines(data.content)}
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={handleGeo} className="px-3.5 py-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">
          Run Geo Intelligence
        </button>
        <button onClick={handleDownload} className="px-3.5 py-2 text-xs rounded bg-purple-600 text-white hover:bg-purple-700">
          Download Compliance Report
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  );
}
