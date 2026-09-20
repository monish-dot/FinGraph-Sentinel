"""
Integration unit tests for FinGraph Sentinel FastAPI endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "backend" in data

def test_dashboard():
    res = client.get("/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["gross_sales"] > 0
    assert data["active_anomalies_count"] == 7
    assert data["settlement_discrepancy_amount"] == 3300.0

def test_anomalies():
    res = client.get("/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 6
    # Flagship check
    set1029 = next((a for a in data if a["event_id"] == "SET-1029"), None)
    assert set1029 is not None
    assert set1029["discrepancy_amount"] == 3300.0
    assert set1029["priority_category"] == "HIGH PRIORITY REVIEW"

def test_anomaly_detail():
    res = client.get("/anomalies/SET-1029")
    assert res.status_code == 200
    data = res.json()
    assert data["event_id"] == "SET-1029"

def test_graph_subgraph():
    res = client.get("/graph/SET-1029")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert data["nodes_count"] > 0
    assert data["edges_count"] > 0

def test_investigate():
    res = client.post("/investigate", json={"event_id": "SET-1029"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INVESTIGATION_COMPLETED"
    assert len(data["tool_execution_steps"]) == 5
    assert "Finding:" in data["report_markdown"]
    assert "₹3,300" in data["report_markdown"]
    assert data["structured_summary"]["discrepancy_amount"] == 3300.0

def test_demo_load():
    res = client.get("/demo/load")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["anomalies_count"] == 7
    assert data["flagship_discrepancy"] == 3300.0
