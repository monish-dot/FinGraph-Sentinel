export interface DashboardMetrics {
  gross_sales: number;
  platform_fees: number;
  refunds: number;
  returns: number;
  net_revenue: number;
  settlement_amount: number;
  active_anomalies_count: number;
  seller_name: string;
  currency: string;
  settlement_discrepancy_amount: number;
  settlement_cycle: string;
}

export interface AnomalyItem {
  anomaly_id: string;
  event_id: string;
  category: string;
  entity_id: string;
  entity_type: string;
  title: string;
  discrepancy_amount: number;
  priority_score: number;
  priority_category: 'HIGH PRIORITY REVIEW' | 'MEDIUM PRIORITY REVIEW' | 'LOW PRIORITY REVIEW';
  signals: string[];
  timestamp: string;
  expected_amount?: number;
  actual_amount?: number;
  feature_breakdown?: {
    amount_deviation: number;
    frequency_change: number;
    relationship_novelty: number;
    temporal_clustering: number;
    historical_deviation: number;
    graph_change: number;
  };
}

export interface ToolStepTrace {
  step_number: number;
  tool_name: string;
  label: string;
  status: string;
  output_summary: string;
  duration_ms: number;
}

export interface InvestigateResponse {
  event_id: string;
  status: string;
  model_provider: string;
  total_duration_seconds: number;
  tool_execution_steps: ToolStepTrace[];
  evidence: {
    event_id: string;
    event_type: string;
    expected_amount: number;
    actual_amount: number;
    difference: number;
    signals: string[];
    deterministic_metrics: Record<string, any>;
    status: string;
  };
  report_markdown: string;
  structured_summary: {
    expected_amount: number;
    actual_amount: number;
    discrepancy_amount: number;
    primary_driver: string;
    recommended_action: string;
  };
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    entity_type: string;
    details: Record<string, any>;
    is_focus: boolean;
    is_anomaly: boolean;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
  data?: Record<string, any>;
}

export interface SubgraphResponse {
  entity_id: string;
  nodes_count: number;
  edges_count: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
