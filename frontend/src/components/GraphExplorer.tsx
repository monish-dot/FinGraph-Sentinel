import React, { useCallback } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SubgraphResponse } from '../types';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

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

// Custom Financial Node
const FinancialNode = ({ data }: any) => {
  const { label, entity_type, is_focus, is_anomaly, details } = data;
  const colorSet = TYPE_COLORS[entity_type] || { bg: '#111827', border: '#4B5563', text: '#9CA3AF', icon: '🔷' };

  return (
    <div
      style={{
        background: colorSet.bg,
        borderColor: is_anomaly ? '#EF4444' : colorSet.border,
        borderWidth: is_focus ? 3 : is_anomaly ? 2 : 1.5,
        borderStyle: 'solid',
        boxShadow: is_focus
          ? `0 0 20px ${colorSet.border}80`
          : is_anomaly
          ? '0 0 14px #EF444460'
          : 'none',
      }}
      className="rounded-xl px-3 py-2 min-w-[120px] max-w-[180px] text-center relative"
    >
      {is_anomaly && !is_focus && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
          <span className="text-[8px]">!</span>
        </div>
      )}

      <Handle type="target" position={Position.Left} style={{ background: colorSet.border, width: 8, height: 8 }} />

      <div className="text-base mb-0.5">{colorSet.icon}</div>
      <div style={{ color: colorSet.text }} className="text-[10px] font-bold truncate">{label}</div>
      <div className="text-[9px] text-slate-500 mt-0.5">{entity_type}</div>

      {/* Show key numeric detail */}
      {details?.amount != null && (
        <div style={{ color: colorSet.text }} className="text-[9px] font-mono mt-0.5">
          ₹{parseFloat(details.amount).toLocaleString('en-IN')}
        </div>
      )}
      {details?.difference != null && details.difference > 0 && (
        <div className="text-[9px] font-mono text-rose-400 mt-0.5">
          Gap: ₹{parseFloat(details.difference).toLocaleString('en-IN')}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: colorSet.border, width: 8, height: 8 }} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  financialNode: FinancialNode,
};

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  subgraph,
  entityId,
  onClose
}) => {
  const rawNodes = subgraph?.nodes ?? [];
  const rawEdges = subgraph?.edges ?? [];

  const [nodes, , onNodesChange] = useNodesState(rawNodes as any);
  const [edges, , onEdgesChange] = useEdgesState(rawEdges as any);

  const [selectedNode, setSelectedNode] = React.useState<any>(null);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  if (!subgraph) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
        <Info className="w-4 h-4" />
        Click "View Graph" on any anomaly to explore the temporal financial relationship network.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800" style={{ height: '560px' }}>
      {/* Legend Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
        {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, cfg]) => (
          <span key={type} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}60` }}>
            {cfg.icon} {type}
          </span>
        ))}
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-rose-950 text-rose-300 border border-rose-700/40">
          🔴 Anomaly path
        </span>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-3 left-3 z-10 text-[9px] font-mono text-slate-500 space-x-3">
        <span>{subgraph.nodes_count} nodes</span>
        <span>{subgraph.edges_count} edges</span>
        <span>Ego network: {entityId}</span>
      </div>

      {/* Selected Node Inspector */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-10 w-56 bg-slate-900/95 backdrop-blur rounded-xl border border-slate-700 p-3 shadow-xl text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">{selectedNode.data?.label}</span>
            <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 text-slate-400 text-[10px]">
            <div>Type: <span className="text-slate-200">{selectedNode.data?.entity_type}</span></div>
            {selectedNode.data?.is_anomaly && (
              <div className="flex items-center gap-1 text-rose-300">
                <AlertTriangle className="w-3 h-3" />
                <span>Anomaly Linked</span>
              </div>
            )}
            {selectedNode.data?.is_focus && (
              <div className="flex items-center gap-1 text-cyan-300">
                <CheckCircle className="w-3 h-3" />
                <span>Investigation Focus</span>
              </div>
            )}
            {Object.entries(selectedNode.data?.details || {}).slice(0, 6).map(([k, v]) => (
              <div key={k} className="font-mono">
                <span className="text-slate-500">{k}: </span>
                <span className="text-slate-200 truncate">{String(v).slice(0, 30)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        style={{ background: '#0B0F19' }}
        defaultEdgeOptions={{
          labelStyle: { fontSize: 9, fill: '#9CA3AF' },
          labelBgStyle: { fill: '#111827', fillOpacity: 0.85 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1F2937" />
        <Controls style={{ background: '#111827', border: '1px solid #1F2937' }} />
        <MiniMap
          style={{ background: '#0B0F19', border: '1px solid #1F2937' }}
          nodeColor={(node: any) => {
            const cfg = TYPE_COLORS[node.data?.entity_type];
            return cfg ? cfg.border : '#4B5563';
          }}
        />
      </ReactFlow>
    </div>
  );
};
