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
import AgentStreamPanel from "./AgentStreamPanel";

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
      title: "Asking Agent",
      label: "Asking Agent",
      status: "idle",
      findings: [],
      riskLevel: null,
      input: "",
    },
  },
];

interface InvestigationContext {
  query: string;
  answers: string[];
  sessionId: string;
  questions?: { question: string; options: string[] }[];
}

interface InvestigationCanvasProps {
  context?: InvestigationContext;
  onBack?: () => void;
}

export default function InvestigationCanvas({ context, onBack }: InvestigationCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // Clean canvas: hide map/memory/trace for now

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

      // Build a clear OSINT-oriented prompt from the context
      const promptLines: string[] = [];
      promptLines.push(
        "The following are context details to use for an OSINT research. Use the osint-investigator agent to research the entity/counterparty and related wallets."
      );
      promptLines.push("");
      promptLines.push(`Context Session: ${context.sessionId}`);
      promptLines.push(`Query: ${context.query}`);
      if (context.answers?.length) {
        promptLines.push("Answers:");
        context.answers.forEach((a, idx) => promptLines.push(`- A${idx + 1}: ${a}`));
      }
      if (context.questions?.length) {
        promptLines.push("Questions:");
        context.questions.forEach((q, idx) => {
          promptLines.push(`- Q${idx + 1}: ${q.question}`);
        });
      }
      promptLines.push("");
      promptLines.push(
        "Task: Begin by invoking the osint-investigator subagent with the above context (as a single string). Then continue with geo-intelligence, pattern-detector, and chain analysis if applicable. Provide concise incremental updates."
      );

      const investigationPrompt = promptLines.join("\n");

      startStream({
        type: "investigate_with_context",
        prompt: investigationPrompt,
      });

      // Reset nodes to initial state
      setNodes([
        {
          id: "orchestrator",
          type: "orchestrator",
          position: { x: 400, y: 200 },
          data: {
            title: "Asking Agent",
            label: "Asking Agent",
            status: "initializing",
            findings: [],
            riskLevel: null,
            input: context.query,
            questions: context.questions || [],
            answers: context.answers || [],
          },
        },
      ]);
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

        {/* Bottom-center single live event toast */}
        <div className="pointer-events-none" style={{ position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)' }}>
          <AgentStreamPanel message={messages[messages.length - 1] as any} />
        </div>
      </ReactFlow>
    </div>
  );
}
