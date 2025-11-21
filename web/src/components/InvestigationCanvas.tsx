"use client";

import React, { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { useInvestigationStore } from "../hooks/useInvestigationStore";
import { useAgentStream } from "../hooks/useAgentStream";
import OrchestratorNode from "./nodes/OrchestratorNode";
import OSINTAgentNode from "./nodes/OSINTAgentNode";
import GeoIntelligenceNode from "./nodes/GeoIntelligenceNode";
import PatternDetectionNode from "./nodes/PatternDetectionNode";
import ChainIntelligenceNode from "./nodes/ChainIntelligenceNode";
import TransactionUploadPanel from "./TransactionUploadPanel";
import MapOverlay from "./MapOverlay";
import MemoryViewerPanel from "./MemoryViewerPanel";

const nodeTypes = {
  orchestrator: OrchestratorNode,
  osint: OSINTAgentNode,
  geo: GeoIntelligenceNode,
  pattern: PatternDetectionNode,
  chain: ChainIntelligenceNode,
};

const initialNodes: Node[] = [
  {
    id: "orchestrator",
    type: "orchestrator",
    position: { x: 400, y: 200 },
    data: {
      label: "Orchestrator",
      status: "idle",
      findings: [],
      riskLevel: null,
    },
  },
];

interface InvestigationContext {
  query: string;
  answers: string[];
  sessionId: string;
}

interface InvestigationCanvasProps {
  context?: InvestigationContext;
  onBack?: () => void;
}

export default function InvestigationCanvas({ context, onBack }: InvestigationCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [showMemory, setShowMemory] = useState(false);

  const { investigation, startInvestigation } = useInvestigationStore();
  const { messages, startStream } = useAgentStream();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleTransactionUpload = async (transactions: any[]) => {
    startInvestigation(transactions);

    // Start orchestrator analysis
    const response = await startStream({
      type: "investigate",
      transactions,
    });

    // Reset nodes to initial state
    setNodes(initialNodes);
    setEdges([]);
  };

  // Auto-start investigation if context is provided
  useEffect(() => {
    if (context && context.query) {
      // Start investigation with context
      startInvestigation([]);

      const investigationData = {
        query: context.query,
        answers: context.answers,
        sessionId: context.sessionId,
      };

      startStream({
        type: "investigate_with_context",
        context: investigationData,
      });

      // Reset nodes to initial state
      setNodes(initialNodes);
      setEdges([]);
    }
  }, [context]);

  // Handle agent spawning from stream
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    if (lastMessage.type === "spawn_agent") {
      const newNode: Node = {
        id: `${lastMessage.agentType}-${Date.now()}`,
        type: lastMessage.agentType,
        position: calculatePosition(lastMessage.parentId || "orchestrator"),
        data: {
          label: lastMessage.agentType,
          status: "initializing",
          findings: [],
          riskLevel: null,
        },
      };

      setNodes((nodes) => [...nodes, newNode]);

      // Add edge from parent to new node
      setEdges((edges) => [
        ...edges,
        {
          id: `${lastMessage.parentId}-${newNode.id}`,
          source: lastMessage.parentId || "orchestrator",
          target: newNode.id,
          animated: true,
        },
      ]);
    } else if (lastMessage.type === "agent_update") {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === lastMessage.agentId) {
            return {
              ...node,
              data: {
                ...node.data,
                status: lastMessage.status,
                findings: lastMessage.findings || node.data.findings,
                riskLevel: lastMessage.riskLevel || node.data.riskLevel,
              },
            };
          }
          return node;
        })
      );
    } else if (lastMessage.type === "map_data") {
      setMapData(lastMessage.data);
      setShowMap(true);
    }
  }, [messages, setNodes, setEdges]);

  const calculatePosition = (parentId: string) => {
    const parentNode = nodes.find((n) => n.id === parentId);
    if (!parentNode) return { x: 400, y: 400 };

    const angle = Math.random() * Math.PI * 2;
    const distance = 200;

    return {
      x: parentNode.position.x + Math.cos(angle) * distance,
      y: parentNode.position.y + Math.sin(angle) * distance,
    };
  };

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />

        {!context && (
          <Panel position="top-left">
            <TransactionUploadPanel onUpload={handleTransactionUpload} />
          </Panel>
        )}

        <Panel position="top-right">
          <div className="flex gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {showMap ? "Hide" : "Show"} Map
            </button>
            <button
              onClick={() => setShowMemory(!showMemory)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              {showMemory ? "Hide" : "Show"} Memory
            </button>
          </div>
        </Panel>

        {context && (
          <Panel position="top-left">
            <div className="bg-white p-4 rounded-lg shadow-lg border max-w-md">
              <h3 className="font-semibold text-gray-800 mb-2">Investigation Context</h3>
              <p className="text-sm text-gray-600 mb-3">"{context.query}"</p>
              <div className="text-xs text-gray-500">
                Session: {context.sessionId}
              </div>
            </div>
          </Panel>
        )}

        {showMap && mapData && (
          <MapOverlay data={mapData} onClose={() => setShowMap(false)} />
        )}

        {showMemory && (
          <MemoryViewerPanel onClose={() => setShowMemory(false)} />
        )}
      </ReactFlow>
    </div>
  );
}
