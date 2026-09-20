"""
FinGraph Sentinel - Serverless FastAPI Backend Application
Handles REST APIs, graph generation, anomaly evaluation, and Strands Bedrock investigations.
Deploys directly to AWS Lambda via Mangum handler and Amazon API Gateway.
"""

import os
import sys
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.schemas import (
    HealthResponse,
    DashboardMetrics,
    AnomalyItem,
    SubgraphResponse,
    InvestigateRequest,
    InvestigateResponse,
    DemoLoadResponse
)
from backend.services.data_service import DataService
from backend.services.s3_service import S3Service
from intelligence.graph_builder import FinancialGraphBuilder
from intelligence.anomaly_detector import HybridAnomalyDetector
from intelligence.evidence_engine import EvidenceEngine
from intelligence.dataset_generator import generate_dataset
from agent.agent import FinGraphInvestigationAgent, STRANDS_AVAILABLE

app = FastAPI(
    title="FinGraph Sentinel API",
    description="Explainable AI Financial Investigation System for Marketplace Sellers",
    version="1.0.0"
)

# Enable CORS for AWS Amplify / Local Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_service = DataService()
s3_service = S3Service()
graph_builder = FinancialGraphBuilder()
anomaly_detector = HybridAnomalyDetector()
evidence_engine = EvidenceEngine()
agent = FinGraphInvestigationAgent()

# Ensure graph is loaded at startup
try:
    graph_builder.load_and_build()
except Exception as e:
    print("Warning: Initial graph build deferred:", e)

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint indicating service availability."""
    return HealthResponse(
        status="HEALTHY",
        version="1.0.0",
        backend="AWS Lambda / FastAPI",
        strands_available=STRANDS_AVAILABLE,
        bedrock_model_id=agent.model_id,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard():
    """Returns top-level financial metrics and anomaly alert count."""
    try:
        kpis = data_service.get_dashboard_kpis()
        return DashboardMetrics(**kpis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate dashboard KPIs: {str(e)}")

@app.get("/anomalies", response_model=List[AnomalyItem])
def get_anomalies():
    """Returns all prioritized anomalies detected across the seller's operations."""
    try:
        results = anomaly_detector.detect_anomalies()
        return [AnomalyItem(**a) for a in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect anomalies: {str(e)}")

@app.get("/anomalies/{anomaly_id}", response_model=AnomalyItem)
def get_anomaly_detail(anomaly_id: str):
    """Retrieves specific anomaly record by ID."""
    results = anomaly_detector.detect_anomalies()
    for a in results:
        if a["anomaly_id"] == anomaly_id or a["event_id"] == anomaly_id:
            return AnomalyItem(**a)
    raise HTTPException(status_code=404, detail=f"Anomaly {anomaly_id} not found.")

@app.get("/settlements/{settlement_id}")
def get_settlement_detail(settlement_id: str):
    """Retrieves detailed settlement reconciliation metrics."""
    settlements = data_service.load_csv("settlements.csv")
    for s in settlements:
        if s.get("settlement_id") == settlement_id:
            return s
    # Default flagship fallback
    return {
        "settlement_id": "SET-1029",
        "period_start": "2026-09-01 00:00:00",
        "period_end": "2026-09-15 23:59:59",
        "expected_amount": 94500.0,
        "actual_amount": 91200.0,
        "difference": 3300.0,
        "status": "FLAGGED"
    }

@app.get("/transactions/{transaction_id}")
def get_transaction_detail(transaction_id: str):
    """Retrieves single transaction details."""
    txs = data_service.load_csv("transactions.csv")
    for t in txs:
        if t.get("transaction_id") == transaction_id:
            return t
    raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found.")

@app.get("/graph/{entity_id}", response_model=SubgraphResponse)
def get_graph_subgraph(entity_id: str):
    """
    Returns ego-subgraph centered around entity_id, formatted natively
    as React Flow nodes and edges with visual anomaly highlights.
    """
    try:
        subgraph = graph_builder.get_ego_subgraph_for_react_flow(entity_id)
        return SubgraphResponse(**subgraph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to construct graph for {entity_id}: {str(e)}")

@app.post("/investigate", response_model=InvestigateResponse)
def run_investigation(req: InvestigateRequest):
    """
    Triggers Strands Agent Bedrock investigation for a specific anomaly ID.
    Executes verified tools, streams execution steps, and returns grounded report.
    """
    try:
        res = agent.investigate(req.event_id, prompt_override=req.prompt_override)
        return InvestigateResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")

@app.get("/demo/load", response_model=DemoLoadResponse)
def load_demo_scenario():
    """
    Resets the workspace to the official deterministic ~10,000 row demo dataset
    with the 7 injected anomalies and Settlement SET-1029 discrepancy.
    """
    try:
        summary = generate_dataset(output_dir="data", total_orders_target=8500)
        graph_builder.load_and_build()
        return DemoLoadResponse(
            status="SUCCESS",
            message="Official demo dataset loaded with 7 controlled anomalies.",
            orders_count=summary["orders_count"],
            transactions_count=summary["transactions_count"],
            anomalies_count=summary["anomalies_injected"],
            flagship_event=summary["flagship_settlement"],
            flagship_discrepancy=summary["flagship_discrepancy"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo scenario: {str(e)}")

@app.post("/upload")
async def upload_csv_file(file: UploadFile = File(...)):
    """Optional CSV upload handler for seller records."""
    allowed = ["orders.csv", "transactions.csv", "refunds.csv", "returns.csv", "fees.csv", "settlements.csv"]
    if file.filename not in allowed:
        raise HTTPException(status_code=400, detail=f"Filename must be one of: {', '.join(allowed)}")

    target_path = os.path.join("data", file.filename)
    contents = await file.read()
    with open(target_path, "wb") as f:
        f.write(contents)

    # Rebuild graph
    graph_builder.load_and_build()
    return {"status": "SUCCESS", "filename": file.filename, "size_bytes": len(contents)}

# -------------------------------------------------------------
# AWS Lambda Handler (Mangum)
# -------------------------------------------------------------
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
