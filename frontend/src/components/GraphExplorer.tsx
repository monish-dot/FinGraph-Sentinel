import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  useViewport,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { SubgraphResponse } from '../types';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ArrowRightLeft,
  Activity,
  Layers,
} from 'lucide-react';

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
    nodesep: 65,
    ranksep: 110,
    marginx: 50,
    marginy: 50,
  });

  const connectedIds = new Set<string>();
  rawEdges.forEach(edge => {
    if (edge.source && edge.target) {
      connectedIds.add(edge.source);
      connectedIds.add(edge.target);
    }
  });

  // Register nodes
  rawNodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Register edges
  rawEdges.forEach(edge => {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // Group nodes by their approximate X coordinate to detect wide ranks
  const rankGroups = new Map<number, string[]>();
  rawNodes.forEach(node => {
    const p = dagreGraph.node(node.id);
    if (p && typeof p.x === 'number') {
      const rankKey = Math.round(p.x / 40) * 40;
      if (!rankGroups.has(rankKey)) rankGroups.set(rankKey, []);
      rankGroups.get(rankKey)!.push(node.id);
    }
  });

  const positionedNodes = rawNodes.map((node, index) => {
    const nodeWithPos = dagreGraph.node(node.id);
    let x: number;
    let y: number;

    if (nodeWithPos && typeof nodeWithPos.x === 'number' && typeof nodeWithPos.y === 'number') {
      const rankKey = Math.round(nodeWithPos.x / 40) * 40;
      const nodesInRank = rankGroups.get(rankKey) || [];
      const idxInRank = nodesInRank.indexOf(node.id);

      // If rank has more than 4 nodes, arrange in 2 staggered sub-columns to prevent tall vertical columns
      if (nodesInRank.length > 4 && direction === 'LR') {
        const subCol = idxInRank % 2;
        const subRow = Math.floor(idxInRank / 2);
        x = nodeWithPos.x - NODE_WIDTH / 2 + subCol * (NODE_WIDTH + 30);
        y = 50 + subRow * (NODE_HEIGHT + 35);
      } else {
        x = nodeWithPos.x - NODE_WIDTH / 2;
        y = nodeWithPos.y - NODE_HEIGHT / 2;
      }
    } else {
      const col = index % 4;
      const row = Math.floor(index / 4);
      x = 50 + col * (NODE_WIDTH + 40);
      y = 50 + row * (NODE_HEIGHT + 30);
    }

    return {
      ...node,
      type: 'financialNode',
      position: { x, y },
      data: { ...node.data },
    };
  });

  const formattedEdges = rawEdges.map((edge, i) => ({
    ...edge,
    id: edge.id || `edge-${i}`,
    animated: edge.animated ?? (edge.data?.is_anomaly || edge.label?.includes('Refund') || edge.data?.is_discrepancy),
    style: {
      stroke: edge.animated || edge.data?.is_anomaly || edge.label?.includes('Refund') ? '#EF4444' : '#4B5563',
      strokeWidth: edge.animated || edge.data?.is_anomaly || edge.label?.includes('Refund') ? 2.5 : 1.5,
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

// ── Floating Zoom & Layout Toolbar ────────────────────────────────────
const ZoomControlToolbar: React.FC<{
  direction: 'LR' | 'TB';
  onToggleDirection: () => void;
}> = ({ direction, onToggleDirection }) => {
  const { fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();
  const zoomPercent = Math.round(zoom * 100);

  // Accelerated snappy zoom with 1.45x factor and 140ms smooth transition
  const handleFastZoomIn = () => {
    zoomTo(Math.min(zoom * 1.45, 4.0), { duration: 140 });
  };

  const handleFastZoomOut = () => {
    zoomTo(Math.max(zoom / 1.45, 0.05), { duration: 140 });
  };

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-1.5 shadow-2xl">
      {/* Fast Zoom In */}
      <button
        onClick={handleFastZoomIn}
        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-200 transition-all border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
        title="Fast Zoom In (+45%)"
        aria-label="Zoom In"
      >
        <ZoomIn className="w-4 h-4 text-cyan-400" />
      </button>

      {/* Zoom Readout & 100% Reset */}
      <button
        onClick={() => zoomTo(1, { duration: 180 })}
        className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-semibold transition-colors border border-slate-700/60 min-w-[54px] text-center cursor-pointer"
        title="Reset zoom to 100%"
      >
        {zoomPercent}%
      </button>

      {/* Fast Zoom Out */}
      <button
        onClick={handleFastZoomOut}
        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-200 transition-all border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
        title="Fast Zoom Out (-45%)"
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-4 h-4 text-cyan-400" />
      </button>

      <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />


      {/* Fit to Screen */}
      <button
        onClick={() => fitView({ padding: 0.25, duration: 400 })}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
        title="Fit all nodes to screen"
      >
        <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Fit View</span>
      </button>

      {/* Orientation Toggle */}
      <button
        onClick={onToggleDirection}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors border border-slate-700"
        title={`Switch layout direction (current: ${direction})`}
      >
        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-bold">{direction}</span>
      </button>
    </div>
  );
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
  const [layoutDir, setLayoutDir] = useState<'LR' | 'TB'>('LR');
  const [hiddenProductsCount, setHiddenProductsCount] = useState<number>(0);

  // Recompute layout whenever subgraph or direction changes
  useEffect(() => {
    if (!subgraph?.nodes || subgraph.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // ── Smart Client-Side Pruning ──────────────────────────────────────
    // 1. Always keep focus node and any anomaly node
    // 2. Always keep non-product nodes (SELLER, SETTLEMENT, BANK, SUPPLIER, ORDER, REFUND)
    // 3. For routine products, keep at most 4 to prevent 37-node skyscrapers
    let normalProductCount = 0;
    let prunedRoutineProducts = 0;

    const filteredNodes = subgraph.nodes.filter(n => {
      const isFocus = n.data?.is_focus || n.id === entityId;
      const isAnomaly = n.data?.is_anomaly || n.id === 'P17' || n.id?.includes('1029');
      const isProduct = n.data?.entity_type === 'PRODUCT';

      if (isFocus || isAnomaly || !isProduct) {
        return true;
      }

      // Routine product node
      if (normalProductCount < 4) {
        normalProductCount++;
        return true;
      } else {
        prunedRoutineProducts++;
        return false;
      }
    });

    setHiddenProductsCount(prunedRoutineProducts);

    // Keep only edges connecting preserved nodes
    const keptNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = subgraph.edges.filter(
      e => keptNodeIds.has(e.source) && keptNodeIds.has(e.target)
    );

    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutGraph(
      filteredNodes,
      filteredEdges,
      layoutDir
    );

    setNodes(layoutedNodes as any);
    setEdges(layoutedEdges as any);

    // Double-fire fitView to guarantee crisp positioning after render
    const t1 = setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 100);
    const t2 = setTimeout(() => fitView({ padding: 0.25, duration: 300 }), 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [subgraph, entityId, layoutDir, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const toggleDirection = useCallback(() => {
    setLayoutDir(prev => (prev === 'LR' ? 'TB' : 'LR'));
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  // Filter/highlight nodes that match search
  const displayNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return (nodes as any[]).map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: (n.id.toLowerCase().includes(q) || n.data?.label?.toLowerCase().includes(q)) ? 1 : 0.2,
        filter: (n.id.toLowerCase().includes(q) || n.data?.label?.toLowerCase().includes(q)) ? 'brightness(1.4)' : 'brightness(0.4)',
      }
    }));
  }, [nodes, searchQuery]);

  return (
    <div className="w-full h-full relative" style={{ width: '100%', height: '100%' }}>
      {/* Legend Bar (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none max-w-[55%]">
        {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, cfg]) => (
          <span
            key={type}
            className="text-[9px] px-1.5 py-0.5 rounded font-mono shadow backdrop-blur bg-slate-900/80"
            style={{ color: cfg.text, border: `1px solid ${cfg.border}80` }}
          >
            {cfg.icon} {type}
          </span>
        ))}
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-rose-950/90 text-rose-300 border border-rose-700/60 shadow">
          🔴 Anomaly Path
        </span>
      </div>

      {/* Node Search (Below Legend) */}
      <div className="absolute top-12 left-3 z-10">
        <input
          type="text"
          placeholder="🔍 Search nodes…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-900/90 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 backdrop-blur"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="ml-1 text-slate-500 hover:text-white text-xs"
          >✕</button>
        )}
      </div>

      {/* Prominent High-Contrast Zoom & Layout Controls (Top Right) */}
      <ZoomControlToolbar direction={layoutDir} onToggleDirection={toggleDirection} />

      {/* Stats Bar (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-slate-400 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2.5 shadow-xl">
        <span><strong>{nodes.length}</strong> nodes</span>
        <span>•</span>
        <span><strong>{edges.length}</strong> edges</span>
        <span>•</span>
        <span>Focus: <strong className="text-cyan-300">{entityId}</strong></span>
        {hiddenProductsCount > 0 && (
          <>
            <span>•</span>
            <span className="text-slate-500">({hiddenProductsCount} collapsed)</span>
          </>
        )}
        <span className="text-slate-700">|</span>
        <span className="text-slate-600 text-[9px]">Scroll=Pan · Ctrl+Scroll=Zoom · Dbl-click=Fit</span>
      </div>

      {/* Selected Node Inspector Drawer (Right Panel) */}
      {selectedNode && (
        <div className="absolute top-16 right-3 z-20 w-72 bg-slate-900/95 backdrop-blur rounded-xl border border-slate-700 p-4 shadow-2xl text-xs animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
            <span className="font-semibold text-white truncate max-w-[200px]">
              {selectedNode.data?.label}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 text-slate-300 text-[11px]">
            <div>
              <span className="text-slate-400">Entity Type: </span>
              <span className="text-cyan-300 font-medium">{selectedNode.data?.entity_type}</span>
            </div>
            {selectedNode.data?.is_anomaly && (
              <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/70 px-2.5 py-1.5 rounded-lg border border-rose-800/60 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Linked to Active Anomaly</span>
              </div>
            )}
            {selectedNode.data?.is_focus && (
              <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/70 px-2.5 py-1.5 rounded-lg border border-cyan-800/60 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Primary Investigation Focus</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[10px]">
              {Object.entries(selectedNode.data?.details || {}).slice(0, 7).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-400 truncate">{k}:</span>
                  <span className="text-white truncate font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Network Radar MiniMap Container (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 hidden sm:block">
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-2.5 py-1 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Network Radar
            </span>
            <span className="text-[9px] text-slate-400">Drag · Scroll to navigate</span>
          </div>
          <MiniMap
            zoomable
            pannable
            style={{
              width: 240,
              height: 150,
              background: '#0B0F19',
              margin: 0,
            }}
            nodeColor={(node: any) => {
              if (node.data?.is_focus)   return '#22D3EE';
              if (node.data?.is_anomaly) return '#EF4444';
              const cfg = TYPE_COLORS[node.data?.entity_type];
              return cfg ? cfg.border : '#4B5563';
            }}
            nodeStrokeWidth={3}
            nodeBorderRadius={4}
            maskColor="rgba(15, 23, 42, 0.70)"
          />
        </div>
      </div>

      {/* React Flow Viewport Canvas */}
      <ReactFlow
        nodes={displayNodes as any}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onDoubleClick={() => fitView({ padding: 0.25, duration: 450 })}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25, includeHiddenNodes: false }}
        minZoom={0.05}
        maxZoom={4.0}
        panOnScroll={true}
        panOnScrollMode={'free' as any}
        zoomOnPinch={true}
        panOnDrag={true}
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        elevateEdgesOnSelect
        style={{ width: '100%', height: '100%', background: '#0B0F19' }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          labelStyle: { fontSize: 10, fill: '#E5E7EB', fontWeight: 600 },
          labelBgStyle: { fill: '#111827', fillOpacity: 0.9, rx: 4, ry: 4 },
          labelBgPadding: [6, 3],
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1F2937" />
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
