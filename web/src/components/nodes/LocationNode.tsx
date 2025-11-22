import React from "react";
import { Handle, Position, NodeProps } from "reactflow";

type LocationNodeData = {
  label: string;
  coords?: { lat: number; lng: number };
  address?: string;
  note?: string;
};

export default function LocationNode({ data }: NodeProps<LocationNodeData>) {
  return (
    <div className="px-3 py-2 shadow-sm rounded-md border bg-white border-gray-200">
      <Handle type="target" position={Position.Top} style={{ background: "#555" }} />
      <div className="text-sm font-semibold text-gray-900">{data.label}</div>
      {data.address && (
        <div className="text-[11px] text-gray-700 mt-0.5">{data.address}</div>
      )}
      {data.coords && (
        <div className="text-[11px] text-gray-500">{data.coords.lat.toFixed(4)}, {data.coords.lng.toFixed(4)}</div>
      )}
      {data.note && (
        <div className="text-[11px] text-gray-600 mt-1">{data.note}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  );
}

