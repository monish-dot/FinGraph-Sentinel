"""
FinGraph Sentinel - Pydantic Request/Response Data Contracts
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    version: str
    backend: str
    strands_available: bool
    bedrock_model_id: str
    timestamp: str

class DashboardMetrics(BaseModel):
    gross_sales: float
    platform_fees: float
    refunds: float
    returns: float
    net_revenue: float
    settlement_amount: float
    active_anomalies_count: int
    seller_name: str
    currency: str = "INR"
    settlement_discrepancy_amount: float = 0.0
    settlement_cycle: str = "Sep 01 - Sep 15, 2026"

class AnomalyItem(BaseModel):
    anomaly_id: str
    event_id: str
    category: str
    entity_id: str
    entity_type: str
    title: str
    discrepancy_amount: float
    priority_score: float
    priority_category: str
    signals: List[str]
    timestamp: str
    expected_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    feature_breakdown: Optional[Dict[str, float]] = None

class SubgraphResponse(BaseModel):
    entity_id: str
    nodes_count: int
    edges_count: int
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class InvestigateRequest(BaseModel):
    event_id: str = Field(..., description="ID of the anomalous event to investigate (e.g. SET-1029, TX-8291, SUP-031)")
    prompt_override: Optional[str] = None

class ToolStepTrace(BaseModel):
    step_number: int
    tool_name: str
    label: str
    status: str
    output_summary: str
    duration_ms: int

class InvestigateResponse(BaseModel):
    event_id: str
    status: str
    model_provider: str
    total_duration_seconds: float
    tool_execution_steps: List[ToolStepTrace]
    evidence: Dict[str, Any]
    report_markdown: str
    structured_summary: Dict[str, Any]

class DemoLoadResponse(BaseModel):
    status: str
    message: str
    orders_count: int
    transactions_count: int
    anomalies_count: int
    flagship_event: str
    flagship_discrepancy: float
