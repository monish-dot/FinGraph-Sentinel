import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeTypes,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { SubgraphResponse } from '../types';
import { X, AlertTriangle, CheckCircle, Info, RefreshCw, ZoomIn } from 'lucide-react';

interface GraphExplorerProps {
  subgraph: SubgraphResponse | null;
  entityId: string | null;
  onClose?: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  SELLER:        { bg: '#0C2040', border: '#3B82F6', text: '#93C5FD', icon: '🏢' },
  PRODUCT:       { bg: '#0C2040', border: '#06B6D4', text: '#67E8F9', icon: '📦' },
  CUSTOMER:      { bg: '#1A1440', border: '#8B5CF6', text: '#C4B5FD', icon: '👤' },
  ORDER:         { bg: '#0C3024', border: '#10B981', text: '#6EE7B7', icon: '📋' },
  REFUND:        { bg: '#3B0A0A', border: '#EF4444', text: '#FCA5A5', icon: '↩️' },
  RETURN:        { bg: '#3B1A0A', border: '#F97316', text: '#FDBA74', icon: '🔄' },
  FEE:           { bg: '#2A2005', border: '#EAB308', text: '#FDE047', icon: '🏷️' },
  SETTLEMENT:    { bg: '#1A0A2A', border: '#A855F7', text: '#D8B4FE', icon: '🏦' },
  BANK_ACCOUNT:  { bg: '#052E1C', border: '#22C55E', text: '#86EFAC', icon: '🏛️' },
  SUPPLIER:      { bg: '#2A1500', border: '#F59E0B', text: '#FCD34D', icon: '🏭' },
};

// ── Dagre Auto-Layout Engine ──────────────────────────────────────────
const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;

function layoutGraph(rawNodes: any[], rawEdges: any[], direction: 'LR' | 'TB' = 'LR') {
  if (!rawNodes || rawNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 45,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  rawNodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  rawEdges.forEach(edge => {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const positionedNodes = rawNodes.map((node, index) => {
    const nodeWithPos = dagreGraph.node(node.id);
    let x = node.position?.x;
    let y = node.position?.y;

    if (nodeWithPos && typeof nodeWithPos.x === 'number' && typeof nodeWithPos.y === 'number') {
      x = nodeWithPos.x - NODE_WIDTH / 2;
      y = nodeWithPos.y - NODE_HEIGHT / 2;
    } else if (typeof x !== 'number' || typeof y !== 'number') {
      // Fallback coordinate positioning if dagre didn't position the node
      const col = index % 5;
      const row = Math.floor(index / 5);
      x = 50 + col * 200;
      y = 50 + row * 120;
    }

    return {
      ...node,
      type: 'financialNode',
      position: { x, y },
      data: {
        ...node.data,
      },
    };
  });

  const formattedEdges = rawEdges.map((edge, i) => ({
    ...edge,
    id: edge.id || `edge-${i}`,
    animated: edge.animated ?? (edge.data?.is_anomaly || edge.label?.includes('Refund')),
    style: {
      stroke: edge.animated || edge.label?.includes('Refund') ? '#EF4444' : '#4B5563',
      strokeWidth: edge.animated || edge.label?.includes('Refund') ? 2.5 : 1.5,
      ...(edge.style || {}),
    },
  }));

  return { nodes: positionedNodes, edges: formattedEdges };
}

// ── Custom Financial Node ─────────────────────────────────────────────
const FinancialNode = React.memo(({ data }: any) => {
  const { label, entity_type, is_focus, is_anomaly, details } = data || {};
  const colorSet = TYPE_COLORS[entity_type] || { bg: '#111827', border: '#4B5563', text: '#9CA3AF', icon: '🔷' };

  return (
    <div
      style={{
        background: colorSet.bg,
        borderColor: is_anomaly ? '#EF4444' : colorSet.border,
        borderWidth: is_focus ? 3 : is_anomaly ? 2 : 1.5,
        borderStyle: 'solid',
        boxShadow: is_focus
          ? `0 0 20px ${colorSet.border}99`
          : is_anomaly
          ? '0 0 14px #EF444466'
          : 'none',
      }}
      className="rounded-xl px-3 py-2.5 min-w-[140px] max-w-[180px] text-center relative select-none cursor-pointer transition-transform hover:scale-105"
    >
      {is_anomaly && !is_focus && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center shadow">
          <span className="text-[9px] font-bold text-white leading-none">!</span>
        </div>
      )}

      {/* Connection Handles on all sides for flexible edge routing */}
      <Handle type="target" position={Position.Left} style={{ background: colorSet.border, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} style={{ background: colorSet.border, width: 8, height: 8 }} />

      <div className="text-sm mb-0.5">{colorSet.icon}</div>
      <div style={{ color: colorSet.text }} className="text-[11px] font-bold truncate leading-tight">
        {label || 'Unknown'}
      </div>
      <div className="text-[9px] text-slate-400 mt-0.5 font-medium tracking-wide">
        {entity_type || 'ENTITY'}
      </div>

      {/* Key numeric detail */}
      {details?.amount != null && (
        <div style={{ color: colorSet.text }} className="text-[10px] font-mono mt-0.5 font-semibold">
          ₹{Number(details.amount).toLocaleString('en-IN')}
        </div>
      )}
      {details?.difference != null && Number(details.difference) > 0 && (
        <div className="text-[9px] font-mono text-rose-300 mt-0.5 font-bold">
          Gap: ₹{Number(details.difference).toLocaleString('en-IN')}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: colorSet.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: colorSet.border, width: 8, height: 8 }} />
    </div>
  );
});

// Stable reference outside of component to prevent React Flow re-registration warnings
const NODE_TYPES: NodeTypes = {
  financialNode: FinancialNode,
};

// ── Internal Canvas with useReactFlow ─────────────────────────────────
const FlowCanvas: React.FC<{
  subgraph: SubgraphResponse | null;
  entityId: string | null;
}> = ({ subgraph, entityId }) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Recompute layout whenever subgraph changes
  useEffect(() => {
    if (!subgraph?.nodes || subgraph.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutGraph(
      subgraph.nodes,
      subgraph.edges,
      'LR'
    );

    setNodes(layoutedNodes as any);
    setEdges(layoutedEdges as any);

    // Give React Flow a frame to measure DOM before fitting view
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);

    return () => clearTimeout(timer);
  }, [subgraph, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const handleRecenter = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  return (
    <div className="w-full h-full relative" style={{ width: '100%', height: '100%' }}>
      {/* Legend Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
        {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, cfg]) => (
          <span
            key={type}
            className="text-[9px] px-1.5 py-0.5 rounded font-mono shadow"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}80` }}
          >
            {cfg.icon} {type}
          </span>
        ))}
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-rose-950 text-rose-300 border border-rose-700/60 shadow">
          🔴 Anomaly Path
        </span>
      </div>

      {/* Stats & Recenter Bar */}
      <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3">
        <span><strong>{nodes.length}</strong> nodes</span>
        <span>•</span>
        <span><strong>{edges.length}</strong> edges</span>
        <span>•</span>
        <span>Focus: <strong className="text-cyan-300">{entityId}</strong></span>
        <button
          onClick={handleRecenter}
          className="ml-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700"
          title="Recenter view"
        >
          <ZoomIn className="w-3 h-3 text-cyan-400" />
          Fit View
        </button>
      </div>

      {/* Selected Node Inspector Panel */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-10 w-64 bg-slate-900/95 backdrop-blur rounded-xl border border-slate-700 p-3.5 shadow-2xl text-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-white truncate max-w-[190px]">
              {selectedNode.data?.label}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-slate-300 text-[11px]">
            <div>
              <span className="text-slate-400">Type: </span>
              <span className="text-cyan-300 font-medium">{selectedNode.data?.entity_type}</span>
            </div>
            {selectedNode.data?.is_anomaly && (
              <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/60 px-2 py-1 rounded border border-rose-800/60 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Linked to Active Anomaly</span>
              </div>
            )}
            {selectedNode.data?.is_focus && (
              <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/60 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Primary Investigation Focus</span>
              </div>
            )}
            <div className="pt-1 border-t border-slate-800/80 space-y-1 font-mono text-[10px]">
              {Object.entries(selectedNode.data?.details || {}).slice(0, 6).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-400 truncate">{k}:</span>
                  <span className="text-white truncate font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* React Flow Viewport Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        style={{ width: '100%', height: '100%', background: '#0B0F19' }}
        defaultEdgeOptions={{
          labelStyle: { fontSize: 10, fill: '#E5E7EB', fontWeight: 600 },
          labelBgStyle: { fill: '#111827', fillOpacity: 0.9, rx: 4, ry: 4 },
          labelBgPadding: [6, 3],
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1F2937" />
        <Controls style={{ background: '#111827', border: '1px solid #374151', color: '#F3F4F6' }} />
        <MiniMap
          style={{ background: '#0B0F19', border: '1px solid #374151', width: 120, height: 90 }}
          nodeColor={(node: any) => {
            const cfg = TYPE_COLORS[node.data?.entity_type];
            return cfg ? cfg.border : '#4B5563';
          }}
          maskColor="rgba(11, 15, 25, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};

// ── Exported GraphExplorer Root (Wrapped in ReactFlowProvider) ────────
export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  subgraph,
  entityId,
  onClose,
}) => {
  if (!subgraph) {
    return (
      <div className="flex flex-col items-center justify-center h-80 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-sm gap-3">
        <Info className="w-6 h-6 text-cyan-400" />
        <p>Loading temporal relationship network...</p>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative"
      style={{ width: '100%', height: '620px', minHeight: '550px' }}
    >
      <ReactFlowProvider>
        <FlowCanvas subgraph={subgraph} entityId={entityId} />
      </ReactFlowProvider>
    </div>
  );
};
