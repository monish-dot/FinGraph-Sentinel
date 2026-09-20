"""
FinGraph Sentinel - Evaluation Benchmark
Compares Baseline (Amount-Only Thresholding) vs Proposed (Hybrid Temporal + Relational Scoring)
Reports: Precision, Recall, F1-Score, False Positive Rate (FPR), and exact counts.
Dataset evaluated: Synthetic Amazon Marketplace-style seller transactions (~8,500+ orders, 7 ground-truth anomalies).
"""

import os
import sys
import json
import csv
from typing import Dict, List, Any, Tuple
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from intelligence.anomaly_detector import HybridAnomalyDetector

def run_evaluation(data_dir: str = "data") -> Dict[str, Any]:
    """
    Executes benchmark comparison between amount-only baseline and proposed hybrid detector.
    """
    gt_path = os.path.join(data_dir, "anomalies_ground_truth.json")
    if not os.path.exists(gt_path):
        raise FileNotFoundError(f"Ground truth file not found at {gt_path}")

    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)

    gt_event_ids = set(g["event_id"] for g in ground_truth)
    total_anomalies_injected = len(gt_event_ids)

    # Load all evaluated events (orders, transactions, settlements, fees)
    tx_file = os.path.join(data_dir, "transactions.csv")
    settle_file = os.path.join(data_dir, "settlements.csv")
    fee_file = os.path.join(data_dir, "fees.csv")

    all_txs = _load_csv(tx_file)
    all_settles = _load_csv(settle_file)
    all_fees = _load_csv(fee_file)

    total_normal_events = len(all_txs) + len(all_settles) + len(all_fees) - total_anomalies_injected

    # -------------------------------------------------------------
    # 1. BASELINE: Amount-Only Anomaly Detection
    # Flags any event where amount > 3.0 standard deviations from mean
    # -------------------------------------------------------------
    amounts = [float(t.get("amount", 0)) for t in all_txs]
    mean_amt = float(np.mean(amounts))
    std_amt = float(np.std(amounts))
    threshold_3sigma = mean_amt + 3.0 * std_amt

    baseline_flagged_ids = set()
    # Check transactions
    for t in all_txs:
        amt = float(t.get("amount", 0))
        if amt > threshold_3sigma:
            baseline_flagged_ids.add(t.get("transaction_id"))
            if t.get("entity_id") in gt_event_ids:
                baseline_flagged_ids.add(t.get("entity_id"))

    # Baseline on settlements (amount only: flag if settlement > 3sigma of historical settlements)
    settle_amts = [float(s.get("actual_amount", 0)) for s in all_settles]
    s_mean = float(np.mean(settle_amts))
    s_std = float(np.std(settle_amts)) if len(settle_amts) > 1 else 1000.0
    for s in all_settles:
        if abs(float(s.get("actual_amount", 0)) - s_mean) > 3.0 * s_std:
            baseline_flagged_ids.add(s.get("settlement_id"))

    baseline_tp = len(baseline_flagged_ids.intersection(gt_event_ids))
    baseline_fp = len(baseline_flagged_ids - gt_event_ids)
    baseline_fn = total_anomalies_injected - baseline_tp
    baseline_tn = total_normal_events - baseline_fp

    baseline_precision = baseline_tp / (baseline_tp + baseline_fp) if (baseline_tp + baseline_fp) > 0 else 0.0
    baseline_recall = baseline_tp / (baseline_tp + baseline_fn) if (baseline_tp + baseline_fn) > 0 else 0.0
    baseline_f1 = (2 * baseline_precision * baseline_recall / (baseline_precision + baseline_recall)) if (baseline_precision + baseline_recall) > 0 else 0.0
    baseline_fpr = baseline_fp / (baseline_fp + baseline_tn) if (baseline_fp + baseline_tn) > 0 else 0.0

    # -------------------------------------------------------------
    # 2. PROPOSED: Hybrid Temporal + Relational Graph Anomaly Engine
    # -------------------------------------------------------------
    detector = HybridAnomalyDetector(data_dir)
    detected = detector.detect_anomalies()
    proposed_flagged_ids = set(d["event_id"] for d in detected)

    proposed_tp = len(proposed_flagged_ids.intersection(gt_event_ids))
    proposed_fp = len(proposed_flagged_ids - gt_event_ids)
    proposed_fn = total_anomalies_injected - proposed_tp
    proposed_tn = total_normal_events - proposed_fp

    proposed_precision = proposed_tp / (proposed_tp + proposed_fp) if (proposed_tp + proposed_fp) > 0 else 0.0
    proposed_recall = proposed_tp / (proposed_tp + proposed_fn) if (proposed_tp + proposed_fn) > 0 else 0.0
    proposed_f1 = (2 * proposed_precision * proposed_recall / (proposed_precision + proposed_recall)) if (proposed_precision + proposed_recall) > 0 else 0.0
    proposed_fpr = proposed_fp / (proposed_fp + proposed_tn) if (proposed_fp + proposed_tn) > 0 else 0.0

    results = {
        "evaluation_dataset": "Synthetic Marketplace Seller (~10k transactions)",
        "synthetic_notice": "Evaluation performed on synthetic benchmark data with controlled ground-truth labels.",
        "dataset_metrics": {
            "total_evaluated_events": total_normal_events + total_anomalies_injected,
            "synthetic_anomalies_injected": total_anomalies_injected,
            "normal_events": total_normal_events
        },
        "baseline_amount_only": {
            "name": "Baseline (Amount-Only 3-Sigma)",
            "anomalies_detected": len(baseline_flagged_ids),
            "true_positives": baseline_tp,
            "false_positives": baseline_fp,
            "false_negatives": baseline_fn,
            "precision": round(baseline_precision, 4),
            "recall": round(baseline_recall, 4),
            "f1_score": round(baseline_f1, 4),
            "false_positive_rate": round(baseline_fpr, 6)
        },
        "proposed_fingraph_sentinel": {
            "name": "FinGraph Sentinel (Hybrid Temporal + Relational)",
            "anomalies_detected": len(proposed_flagged_ids),
            "true_positives": proposed_tp,
            "false_positives": proposed_fp,
            "false_negatives": proposed_fn,
            "precision": round(proposed_precision, 4),
            "recall": round(proposed_recall, 4),
            "f1_score": round(proposed_f1, 4),
            "false_positive_rate": round(proposed_fpr, 6)
        }
    }

    return results

def _load_csv(path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

if __name__ == "__main__":
    res = run_evaluation("data")
    print("\n=======================================================")
    print("FINGRAPH SENTINEL — ANOMALY EVALUATION BENCHMARK")
    print("=======================================================")
    print(f"Notice: {res['synthetic_notice']}\n")
    print(f"Total Evaluated Events: {res['dataset_metrics']['total_evaluated_events']}")
    print(f"Ground-Truth Anomalies Injected: {res['dataset_metrics']['synthetic_anomalies_injected']}\n")

    b = res["baseline_amount_only"]
    p = res["proposed_fingraph_sentinel"]

    print("--- BASELINE (Amount-Only) ---")
    print(f"  Detected: {b['anomalies_detected']} | TP: {b['true_positives']} | FP: {b['false_positives']} | FN: {b['false_negatives']}")
    print(f"  Precision: {b['precision']:.2%} | Recall: {b['recall']:.2%} | F1: {b['f1_score']:.4f} | FPR: {b['false_positive_rate']:.4%}\n")

    print("--- PROPOSED (FinGraph Sentinel Hybrid Temporal + Relational) ---")
    print(f"  Detected: {p['anomalies_detected']} | TP: {p['true_positives']} | FP: {p['false_positives']} | FN: {p['false_negatives']}")
    print(f"  Precision: {p['precision']:.2%} | Recall: {p['recall']:.2%} | F1: {p['f1_score']:.4f} | FPR: {p['false_positive_rate']:.4%}")
    print("=======================================================\n")
