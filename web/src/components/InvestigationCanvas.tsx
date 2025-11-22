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
import ReportNode from "./nodes/ReportNode";
import AgentStreamPanel from "./AgentStreamPanel";

const nodeTypes = {
  orchestrator: OrchestratorNode,
  osint: OSINTAgentNode,
  geo: GeoIntelligenceNode,
  pattern: PatternDetectionNode,
  chain: ChainIntelligenceNode,
  report: ReportNode,
};

const initialNodes: Node[] = [
  {
    id: "orchestrator",
    type: "orchestrator",
    position: { x: 400, y: 200 },
    data: {
      title: "OSINT Agent",
      label: "OSINT Agent",
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
  demo?: boolean;
}

export default function InvestigationCanvas({ context, onBack, demo = false }: InvestigationCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // Clean canvas: hide map/memory/trace for now

  const { investigation, startInvestigation } = useInvestigationStore();
  const { messages, startStream } = useAgentStream();

  const [latestOsintId, setLatestOsintId] = useState<string | null>(null);
  const [reportDraft, setReportDraft] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Upload transactions removed for demo focus

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

  // Demo mode: show report immediately
  useEffect(() => {
    if (demo) {
      const reportId = `report-${Date.now()}`;
      // Define handlers that also spawn mock child nodes
      const runGeo = (text: string) => {
        const prompt = `Use the geo-intelligence agent to analyze the following OSINT findings and provide geographic risk insights and routing patterns.\n\nREPORT:\n${text}`;
        startStream({ type: "investigate_with_context", prompt });
        const geoId = `geo-${Date.now()}`;
        const geoPos = calculatePosition(reportId);
        const nowA = Date.now();
        const locations = [
          { id: `loc-${nowA}-1`, label: 'Miami, USA', coords: { lat: 25.7617, lng: -80.1918 }, note: 'Origin', address: 'Miami, Florida, USA' },
          { id: `loc-${nowA}-2`, label: 'Cayman Islands', coords: { lat: 19.3133, lng: -81.2546 }, note: 'Intermediate', address: 'George Town, Grand Cayman' },
          { id: `loc-${nowA}-3`, label: 'Cyprus', coords: { lat: 35.1264, lng: 33.4299 }, note: 'Destination (high-risk)', address: 'Nicosia, Cyprus' },
        ];
        const radiusA = 180;
        const baseAngleA = Math.random() * Math.PI;
        setNodes((prev) => [
          ...prev,
          { id: geoId, type: 'geo', position: geoPos, data: { label: 'Geo Intel', status: 'complete', findings: ['Route mapped Miami → Cayman → Cyprus'], riskLevel: 'high' } },
          ...locations.map((loc, idx) => {
            const angle = baseAngleA + (idx * (2 * Math.PI / locations.length));
            const pos = { x: geoPos.x + radiusA * Math.cos(angle), y: geoPos.y + radiusA * Math.sin(angle) };
            return { id: loc.id, type: 'location', position: pos, data: { label: loc.label, coords: loc.coords, note: loc.note, address: (loc as any).address } };
          }),
        ]);
        setEdges((prev) => [
          ...prev,
          { id: `${reportId}-${geoId}`, source: reportId, target: geoId, animated: true },
          ...locations.map((loc) => ({ id: `${geoId}-${loc.id}`, source: geoId, target: loc.id, animated: true })),
        ]);
      };
      const runPattern = (text: string) => {
        const prompt = `Use the pattern-detector agent to analyze the following OSINT findings for structuring, layering, and other AML typologies.\n\nREPORT:\n${text}`;
        startStream({ type: "investigate_with_context", prompt });
        const patId = `pattern-${Date.now()}`;
        const patPos = calculatePosition(reportId);
        setNodes((prev) => [
          ...prev,
          { id: patId, type: 'pattern', position: patPos, data: { label: 'Pattern Detector', status: 'complete', findings: ['Structuring pattern near $10k threshold', 'Layering indicators present'], riskLevel: 'high' } },
        ]);
        setEdges((prev) => [ ...prev, { id: `${reportId}-${patId}`, source: reportId, target: patId, animated: true } ]);
      };

      setNodes([
        {
          id: reportId,
          type: "report",
          position: { x: 380, y: 160 },
          data: {
            title: "OSINT Report",
            content: `## **COMPREHENSIVE AML INVESTIGATION SUMMARY**\n\nBased on the completed multi-agent analysis, here are the key findings and risk assessment:\n\n### **FINAL RISK ASSESSMENT: HIGH RISK - 85/100**\n\n**Primary Findings:**\n- **OSINT Analysis**: MODERATE-HIGH risk crypto exchange off-ramp operation with third-party facilitation\n- **Geo-Intelligence**: HIGH risk geographic routing (90/100) showing sophisticated jurisdiction knowledge inconsistent with first-time user claims  \n- **Pattern Detection**: HIGH risk ML indicator(82.5/100) consistent with coordinated laundering scheme\n\n### **Critical Risk Indicators Identified:**\n\n1. **Transaction Sophistication vs. User Profile Mismatch**\n   - $50K Bitcoin-to-wire transfer for "first-time" user\n   - Sophisticated high-risk jurisdiction routing\n   - CTR threshold awareness despite claimed inexperience\n\n2. **Geographic Risk Concentration**\n   - Wire transfer to high-risk jurisdiction\n   - Pattern consistent with sanctions evasion methodology\n   - Crypto off-ramp hub utilization\n\n3. **Behavioral Pattern Red Flags**\n   - Round $50K amount suggesting structuring awareness\n   - Complex crypto-to-fiat conversion process\n   - Third-party facilitation indicators\n\n### **IMMEDIATE ACTIONS REQUIRED:**\n\n🚨 **PRIORITY 1 - COMPLIANCE ACTIONS:**\n- **FREEZE TRANSACTION** pending investigation\n- **SAR FILING MANDATORY** within 30 days\n- **Senior compliance notification** within 24 hours\n\n🔍 **PRIORITY 2 - ENHANCED DUE DILIGENCE:**\n- Bitcoin wallet transaction history analysis\n- Ultimate beneficial owner verification  \n- Source of funds documentation ($50K)\n- Correspondent bank inquiry\n\n📊 **PRIORITY 3 - ONGOING MONITORING:**\n- 90-day enhanced monitoring protocol\n- Network analysis for related transactions\n- Geographic flagging of similar patterns\n\n### **EVIDENCE SUMMARY:**\n- **High confidence** (85%+) in ML activity assessment\n- **Multiple corroborating** risk indicators across all analysis dimensions\n- **Clear documentation trail** for regulatory reporting\n- **Actionable intelligence** for immediate compliance response\n\n**RECOMMENDATION: ESCALATE TO COMPLIANCE OFFICER FOR IMMEDIATE REVIEW AND ACTION**`,
            onRunGeo: (text: string) => runGeo(text),
            onDownload: (text: string) => {
              const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'compliance_report.md';
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            },
          },
        },
      ]);
      setEdges([]);
    }
  }, [demo]);

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

      if (lastMessage.agentType === "osint") {
        setLatestOsintId(newNode.id);
      }

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
    } else if ((lastMessage as any).content && Array.isArray((lastMessage as any).content)) {
      // Capture potential final report text from Claude content
      const content = (lastMessage as any).content;
      const first = content[0];
      const text = first?.text as string | undefined;
      if (text && text.trim().length > 200) {
        setReportDraft(text);
      }
    } else if (lastMessage.type === "complete") {
      // Mark initial node complete
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === "orchestrator" ? { ...n, data: { ...n.data, status: "complete" } } : n
        )
      );
      // Place a mock report node with provided template and hide OSINT
      const mockContent = `## **COMPREHENSIVE AML INVESTIGATION SUMMARY**\n\nBased on the completed multi-agent analysis, here are the key findings and risk assessment:\n\n### **FINAL RISK ASSESSMENT: HIGH RISK - 85/100**\n\n**Primary Findings:**\n- **OSINT Analysis**: MODERATE-HIGH risk crypto exchange off-ramp operation with third-party facilitation\n- **Geo-Intelligence**: HIGH risk geographic routing (90/100) showing sophisticated jurisdiction knowledge inconsistent with first-time user claims  \n- **Pattern Detection**: HIGH risk ML indicator(82.5/100) consistent with coordinated laundering scheme\n\n### **Critical Risk Indicators Identified:**\n\n1. **Transaction Sophistication vs. User Profile Mismatch**\n   - $50K Bitcoin-to-wire transfer for "first-time" user\n   - Sophisticated high-risk jurisdiction routing\n   - CTR threshold awareness despite claimed inexperience\n\n2. **Geographic Risk Concentration**\n   - Wire transfer to high-risk jurisdiction\n   - Pattern consistent with sanctions evasion methodology\n   - Crypto off-ramp hub utilization\n\n3. **Behavioral Pattern Red Flags**\n   - Round $50K amount suggesting structuring awareness\n   - Complex crypto-to-fiat conversion process\n   - Third-party facilitation indicators\n\n### **IMMEDIATE ACTIONS REQUIRED:**\n\n🚨 **PRIORITY 1 - COMPLIANCE ACTIONS:**\n- **FREEZE TRANSACTION** pending investigation\n- **SAR FILING MANDATORY** within 30 days\n- **Senior compliance notification** within 24 hours\n\n🔍 **PRIORITY 2 - ENHANCED DUE DILIGENCE:**\n- Bitcoin wallet transaction history analysis\n- Ultimate beneficial owner verification  \n- Source of funds documentation ($50K)\n- Correspondent bank inquiry\n\n📊 **PRIORITY 3 - ONGOING MONITORING:**\n- 90-day enhanced monitoring protocol\n- Network analysis for related transactions\n- Geographic flagging of similar patterns\n\n### **EVIDENCE SUMMARY:**\n- **High confidence** (85%+) in ML activity assessment\n- **Multiple corroborating** risk indicators across all analysis dimensions\n- **Clear documentation trail** for regulatory reporting\n- **Actionable intelligence** for immediate compliance response\n\n**RECOMMENDATION: ESCALATE TO COMPLIANCE OFFICER FOR IMMEDIATE REVIEW AND ACTION**`;

      const parentId = latestOsintId || "orchestrator";
      const pos = calculatePosition(parentId);
      const reportId = `report-${Date.now()}`;

      const runGeo = (text: string) => {
        const prompt = `Use the geo-intelligence agent to analyze the following OSINT findings and provide geographic risk insights and routing patterns.\n\nREPORT:\n${text}`;
        startStream({ type: "investigate_with_context", prompt });
        const geoId = `geo-${Date.now()}`;
        const geoPos = calculatePosition(reportId);
        const locations = [
          { id: `loc-${Date.now()}-1`, label: 'Miami, USA', coords: { lat: 25.7617, lng: -80.1918 }, note: 'Origin' },
          { id: `loc-${Date.now()}-2`, label: 'Cayman Islands', coords: { lat: 19.3133, lng: -81.2546 }, note: 'Intermediate' },
          { id: `loc-${Date.now()}-3`, label: 'Cyprus', coords: { lat: 35.1264, lng: 33.4299 }, note: 'Destination (high-risk)' },
        ];
        setNodes((prev) => [
          ...prev,
          { id: geoId, type: 'geo', position: geoPos, data: { label: 'Geo Intel', status: 'complete', findings: ['Route mapped Miami → Cayman → Cyprus'], riskLevel: 'high' } },
          ...locations.map((loc) => ({ id: loc.id, type: 'location', position: calculatePosition(geoId), data: { label: loc.label, coords: loc.coords, note: loc.note } })),
        ]);
        setEdges((prev) => [
          ...prev,
          { id: `${reportId}-${geoId}`, source: reportId, target: geoId, animated: true },
          ...locations.map((loc) => ({ id: `${geoId}-${loc.id}`, source: geoId, target: loc.id, animated: true })),
        ]);
      };
      const runPattern = (text: string) => {
        const prompt = `Use the pattern-detector agent to analyze the following OSINT findings for structuring, layering, and other AML typologies.\n\nREPORT:\n${text}`;
        startStream({ type: "investigate_with_context", prompt });
        const patId = `pattern-${Date.now()}`;
        const patPos = calculatePosition(reportId);
        setNodes((prev) => [
          ...prev,
          { id: patId, type: 'pattern', position: patPos, data: { label: 'Pattern Detector', status: 'complete', findings: ['Structuring pattern near $10k threshold', 'Layering indicators present'], riskLevel: 'high' } },
        ]);
        setEdges((prev) => [ ...prev, { id: `${reportId}-${patId}`, source: reportId, target: patId, animated: true } ]);
      };

      setNodes((prev) => [
        ...prev.map((n) =>
          latestOsintId && n.id === latestOsintId ? { ...n, hidden: true } : n
        ),
        {
          id: reportId,
          type: "report",
          position: pos,
          data: {
            title: "OSINT Report",
            content: mockContent,
            onRunGeo: runGeo,
            onRunPattern: runPattern,
          },
        },
      ]);

      setEdges((prev) => [
        ...prev,
        {
          id: `${parentId}-${reportId}`,
          source: parentId,
          target: reportId,
          animated: true,
        },
      ]);
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

        {/* Upload panel removed in demo mode */}

        {/* Bottom-center single live event toast */}
        <div className="pointer-events-none" style={{ position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)' }}>
          <AgentStreamPanel message={messages[messages.length - 1] as any} />
        </div>
      </ReactFlow>
    </div>
  );
}
