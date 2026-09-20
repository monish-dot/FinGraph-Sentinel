"""
Unit tests for FinGraph Sentinel intelligence modules:
- Dataset generator
- Graph builder
- Anomaly detector
- Evidence engine
- Evaluation benchmark
"""

import os
import pytest
from intelligence.dataset_generator import generate_dataset
from intelligence.graph_builder import FinancialGraphBuilder
from intelligence.anomaly_detector import HybridAnomalyDetector
from intelligence.evidence_engine import EvidenceEngine
from intelligence.evaluation import run_evaluation

def test_dataset_generation(tmp_path):
    out_dir = str(tmp_path / "test_data")
    summary = generate_dataset(output_dir=out_dir, total_orders_target=500)
    assert summary["orders_count"] > 500
    assert summary["anomalies_injected"] == 7
    assert summary["flagship_settlement"] == "SET-1029"
    assert summary["flagship_discrepancy"] == 3300.0

def test_graph_builder(tmp_path):
    out_dir = str(tmp_path / "test_data")
    generate_dataset(output_dir=out_dir, total_orders_target=300)
    builder = FinancialGraphBuilder(out_dir)
    g = builder.load_and_build()
    assert g.number_of_nodes() > 100
    assert g.number_of_edges() > 100

    subgraph = builder.get_ego_subgraph_for_react_flow("SET-1029")
    assert "nodes" in subgraph
    assert "edges" in subgraph
    assert len(subgraph["nodes"]) > 0

def test_anomaly_detector(tmp_path):
    out_dir = str(tmp_path / "test_data")
    generate_dataset(output_dir=out_dir, total_orders_target=300)
    detector = HybridAnomalyDetector(out_dir)
    anomalies = detector.detect_anomalies()
    assert len(anomalies) >= 6
    
    set1029 = next((a for a in anomalies if a["event_id"] == "SET-1029"), None)
    assert set1029 is not None
    assert set1029["priority_category"] == "HIGH PRIORITY REVIEW"
    assert set1029["discrepancy_amount"] == 3300.0

def test_evidence_engine(tmp_path):
    out_dir = str(tmp_path / "test_data")
    generate_dataset(output_dir=out_dir, total_orders_target=300)
    engine = EvidenceEngine(out_dir)
    evidence = engine.get_evidence("SET-1029")
    assert evidence["event_id"] == "SET-1029"
    assert evidence["expected_amount"] == 94500.0
    assert evidence["actual_amount"] == 91200.0
    assert evidence["difference"] == 3300.0
    assert "refund activity increased 2.7x" in evidence["signals"]
    assert evidence["status"] == "REQUIRES_HUMAN_REVIEW"

def test_evaluation(tmp_path):
    out_dir = str(tmp_path / "test_data")
    generate_dataset(output_dir=out_dir, total_orders_target=300)
    eval_res = run_evaluation(out_dir)
    assert "baseline_amount_only" in eval_res
    assert "proposed_fingraph_sentinel" in eval_res
    assert eval_res["proposed_fingraph_sentinel"]["recall"] >= 0.85
