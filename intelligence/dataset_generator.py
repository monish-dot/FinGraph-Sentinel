"""
FinGraph Sentinel - Synthetic Dataset Generator
Generates realistic marketplace seller dataset (~10,000 transactions) with injected controlled anomalies.
Reproducible with configurable random seed.
"""

import os
import random
import json
import csv
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

SELLER_ID = "SEL-001"
SELLER_NAME = "Apex Retailers (Amazon IN)"

def generate_dataset(output_dir: str = "data", total_orders_target: int = 8500) -> Dict[str, Any]:
    """Generates synthetic dataset and writes CSV files to output_dir."""
    os.makedirs(output_dir, exist_ok=True)
    random.seed(RANDOM_SEED)

    # Base date range: Aug 01, 2026 to Sep 20, 2026 (~50 days)
    start_date = datetime(2026, 8, 1, 9, 0, 0)
    end_date = datetime(2026, 9, 20, 18, 0, 0)
    total_seconds = int((end_date - start_date).total_seconds())

    # 1. Entities
    num_customers = 500
    customers = [f"CUST-{i:04d}" for i in range(1, num_customers + 1)]
    
    num_products = 100
    products = []
    categories = ["Electronics", "Home & Kitchen", "Apparel", "Office Supplies", "Health & Personal"]
    for i in range(1, num_products + 1):
        pid = "P17" if i == 17 else f"PROD-{i:03d}"
        cat = "Electronics" if pid == "P17" else categories[i % len(categories)]
        base_price = 1100.0 if pid == "P17" else round(random.uniform(250.0, 4500.0), 2)
        products.append({
            "product_id": pid,
            "title": f"Premium Tech Wireless Gadget P17" if pid == "P17" else f"Marketplace Item {pid}",
            "category": cat,
            "base_price": base_price,
            "supplier_id": f"SUP-{(i % 30) + 1:03d}"
        })

    num_suppliers = 30
    suppliers = [f"SUP-{i:03d}" for i in range(1, num_suppliers + 1)]

    orders = []
    transactions = []
    fees = []
    refunds = []
    returns = []
    settlements = []
    ground_truth_anomalies = []

    # Map product by ID for quick lookup
    prod_map = {p["product_id"]: p for p in products}

    # Generate baseline normal orders
    order_counter = 1000
    tx_counter = 5000
    fee_counter = 7000
    refund_counter = 8000
    return_counter = 9000

    current_time = start_date
    delta_seconds = total_seconds / total_orders_target

    for i in range(total_orders_target):
        current_time = start_date + timedelta(seconds=int(i * delta_seconds) + random.randint(-15, 15))
        order_counter += 1
        tx_counter += 1
        order_id = f"ORD-{order_counter}"
        tx_id = f"TX-{tx_counter}"
        
        # Select customer & product
        cust_id = random.choice(customers)
        # Give P17 normal realistic order weight
        prod = prod_map["P17"] if random.random() < 0.04 else random.choice(products)
        qty = 1 if random.random() < 0.85 else 2
        unit_price = prod["base_price"]
        gross_amount = round(unit_price * qty, 2)
        
        # Platform fee (approx 15% referral + fixed FBA fee)
        referral_fee = round(gross_amount * 0.15, 2)
        fba_fee = round(55.0 * qty, 2)
        total_fee = round(referral_fee + fba_fee, 2)
        
        timestamp_str = current_time.strftime("%Y-%m-%d %H:%M:%S")

        orders.append({
            "order_id": order_id,
            "seller_id": SELLER_ID,
            "customer_id": cust_id,
            "product_id": prod["product_id"],
            "quantity": qty,
            "unit_price": unit_price,
            "gross_amount": gross_amount,
            "status": "COMPLETED",
            "timestamp": timestamp_str
        })

        transactions.append({
            "transaction_id": tx_id,
            "order_id": order_id,
            "entity_type": "CUSTOMER",
            "entity_id": cust_id,
            "amount": gross_amount,
            "direction": "INFLOW",
            "type": "ORDER_PAYMENT",
            "timestamp": timestamp_str
        })

        fee_counter += 1
        fees.append({
            "fee_id": f"FEE-{fee_counter}",
            "order_id": order_id,
            "seller_id": SELLER_ID,
            "fee_type": "REFERRAL_AND_FBA",
            "amount": total_fee,
            "timestamp": timestamp_str
        })

        # Normal baseline refund rate ~ 2%
        if random.random() < 0.022 and prod["product_id"] != "P17":
            refund_counter += 1
            refund_id = f"RF-{refund_counter}"
            refund_time = current_time + timedelta(hours=random.randint(12, 72))
            refunds.append({
                "refund_id": refund_id,
                "order_id": order_id,
                "product_id": prod["product_id"],
                "customer_id": cust_id,
                "amount": gross_amount,
                "reason": "Customer Return",
                "timestamp": refund_time.strftime("%Y-%m-%d %H:%M:%S")
            })
            if random.random() < 0.7:
                return_counter += 1
                returns.append({
                    "return_id": f"RET-{return_counter}",
                    "order_id": order_id,
                    "product_id": prod["product_id"],
                    "customer_id": cust_id,
                    "condition": "Sellable",
                    "timestamp": (refund_time + timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S")
                })

    # =========================================================================
    # INJECT 7 CONTROLLED ANOMALIES
    # =========================================================================

    # -------------------------------------------------------------------------
    # Anomaly 1 (FLAGSHIP DEMO): Settlement SET-1029 Mismatch & Product P17 Refund Spike
    # Settlement window: Sep 01, 2026 to Sep 15, 2026
    # Target: Expected ₹94,500, Actual ₹91,200, Discrepancy ₹3,300
    # Root Cause: 3 refunds of ₹1,100 each for Product P17 occurring in Sep 14-15 window (cluster)
    # -------------------------------------------------------------------------
    p17_refund_cluster_time = datetime(2026, 9, 14, 14, 20, 0)
    p17_refund_order_ids = []
    
    for k in range(3):
        order_counter += 1
        tx_counter += 1
        refund_counter += 1
        return_counter += 1
        
        ord_id = f"ORD-P17-{k+1}"
        p17_refund_order_ids.append(ord_id)
        rf_id = f"RF-1029-{k+1}"
        ret_id = f"RET-1029-{k+1}"
        cust_k = customers[k + 10]
        
        ord_time = (p17_refund_cluster_time - timedelta(days=2, hours=k*4)).strftime("%Y-%m-%d %H:%M:%S")
        rf_time = (p17_refund_cluster_time + timedelta(hours=k*6)).strftime("%Y-%m-%d %H:%M:%S")
        
        orders.append({
            "order_id": ord_id,
            "seller_id": SELLER_ID,
            "customer_id": cust_k,
            "product_id": "P17",
            "quantity": 1,
            "unit_price": 1100.0,
            "gross_amount": 1100.0,
            "status": "REFUNDED",
            "timestamp": ord_time
        })
        transactions.append({
            "transaction_id": f"TX-P17-ORD-{k+1}",
            "order_id": ord_id,
            "entity_type": "CUSTOMER",
            "entity_id": cust_k,
            "amount": 1100.0,
            "direction": "INFLOW",
            "type": "ORDER_PAYMENT",
            "timestamp": ord_time
        })
        refunds.append({
            "refund_id": rf_id,
            "order_id": ord_id,
            "product_id": "P17",
            "customer_id": cust_k,
            "amount": 1100.0,
            "reason": "Defective Item Batch",
            "timestamp": rf_time
        })
        returns.append({
            "return_id": ret_id,
            "order_id": ord_id,
            "product_id": "P17",
            "customer_id": cust_k,
            "condition": "Defective",
            "timestamp": rf_time
        })

    # Flagship Settlement SET-1029
    settlements.append({
        "settlement_id": "SET-1029",
        "seller_id": SELLER_ID,
        "period_start": "2026-09-01 00:00:00",
        "period_end": "2026-09-15 23:59:59",
        "expected_amount": 94500.0,
        "actual_amount": 91200.0,
        "difference": 3300.0,
        "discrepancy_amount": 3300.0,
        "status": "FLAGGED",
        "primary_entity": "P17",
        "timestamp": "2026-09-16 08:30:00"
    })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-SET-1029",
        "event_id": "SET-1029",
        "category": "SETTLEMENT_MISMATCH",
        "entity_id": "SET-1029",
        "related_product": "P17",
        "expected_amount": 94500.0,
        "actual_amount": 91200.0,
        "difference": 3300.0,
        "priority_score": 0.89,
        "priority": "HIGH",
        "signals": [
            "refund activity increased 2.7x",
            "Product P17 contributes most of the increase",
            "related transactions cluster within 72 hours",
            "settlement differs from historical baseline"
        ],
        "description": "Settlement #1029 discrepancy of ₹3,300 attributed to 3 concentrated customer refunds on Product P17."
    })

    # -------------------------------------------------------------------------
    # Anomaly 2: New Supplier Relationship Novelty + Payment Spikes (SUP-031)
    # -------------------------------------------------------------------------
    sup_novel_id = "SUP-031"
    sup_dates = [
        datetime(2026, 9, 8, 11, 0, 0),
        datetime(2026, 9, 10, 15, 30, 0),
        datetime(2026, 9, 12, 9, 15, 0),
        datetime(2026, 9, 14, 16, 45, 0),
        datetime(2026, 9, 15, 14, 0, 0)
    ]
    sup_amounts = [18000.0, 20000.0, 19000.0, 23000.0, 24000.0]
    
    for idx, (sdate, samt) in enumerate(zip(sup_dates, sup_amounts)):
        tx_counter += 1
        transactions.append({
            "transaction_id": f"TX-SUP-NOV-{idx+1}",
            "order_id": f"PO-SUP-NOV-{idx+1}",
            "entity_type": "SUPPLIER",
            "entity_id": sup_novel_id,
            "amount": samt,
            "direction": "OUTFLOW",
            "type": "SUPPLIER_PAYMENT",
            "timestamp": sdate.strftime("%Y-%m-%d %H:%M:%S")
        })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-SUP-NOVEL",
        "event_id": "SUP-031",
        "category": "NEW_SUPPLIER_RELATIONSHIP",
        "entity_id": sup_novel_id,
        "priority_score": 0.82,
        "priority": "HIGH",
        "signals": [
            "New supplier relationship with zero historical transactions",
            "Rapid payment frequency: 5 payments within 7 days",
            "Total unverified outflow: ₹1,04,000",
            "Novel graph edge creation with high edge weight"
        ],
        "description": "Unregistered supplier SUP-031 received ₹1,04,000 across 5 rapid transfers without historical trading tenure."
    })

    # -------------------------------------------------------------------------
    # Anomaly 3: High-Frequency Transaction Burst (PROD-042)
    # 12 orders within 15 minutes
    # -------------------------------------------------------------------------
    burst_start = datetime(2026, 9, 11, 2, 10, 0) # 2:10 AM
    burst_orders = []
    for b in range(12):
        order_counter += 1
        tx_counter += 1
        b_time = burst_start + timedelta(seconds=b * 65)
        ord_id = f"ORD-BURST-{b+1}"
        tx_id = f"TX-BURST-{b+1}"
        burst_orders.append(ord_id)
        
        orders.append({
            "order_id": ord_id,
            "seller_id": SELLER_ID,
            "customer_id": random.choice(customers[:50]),
            "product_id": "PROD-042",
            "quantity": 1,
            "unit_price": 899.0,
            "gross_amount": 899.0,
            "status": "COMPLETED",
            "timestamp": b_time.strftime("%Y-%m-%d %H:%M:%S")
        })
        transactions.append({
            "transaction_id": tx_id,
            "order_id": ord_id,
            "entity_type": "CUSTOMER",
            "entity_id": orders[-1]["customer_id"],
            "amount": 899.0,
            "direction": "INFLOW",
            "type": "ORDER_PAYMENT",
            "timestamp": b_time.strftime("%Y-%m-%d %H:%M:%S")
        })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-BURST-TX",
        "event_id": "PROD-042",
        "category": "TRANSACTION_BURST",
        "entity_id": "PROD-042",
        "priority_score": 0.78,
        "priority": "HIGH",
        "signals": [
            "12 orders placed within 13 minutes (normal velocity: 1 order/day)",
            "Timestamp clustering index = 0.94",
            "Concentrated nocturnal order activity (02:10 - 02:23 AM)",
            "Possible inventory lock or automated scraping script"
        ],
        "description": "High velocity ordering burst on PROD-042 with 12 consecutive purchases in under 15 minutes."
    })

    # -------------------------------------------------------------------------
    # Anomaly 4: Unusual Transaction Amount (TX-8291)
    # Single order of ₹85,000 where average order is ₹1,200
    # -------------------------------------------------------------------------
    tx_outlier_time = datetime(2026, 9, 13, 11, 45, 0).strftime("%Y-%m-%d %H:%M:%S")
    orders.append({
        "order_id": "ORD-8291",
        "seller_id": SELLER_ID,
        "customer_id": "CUST-0189",
        "product_id": "PROD-005",
        "quantity": 50,
        "unit_price": 1700.0,
        "gross_amount": 85000.0,
        "status": "PENDING_REVIEW",
        "timestamp": tx_outlier_time
    })
    transactions.append({
        "transaction_id": "TX-8291",
        "order_id": "ORD-8291",
        "entity_type": "CUSTOMER",
        "entity_id": "CUST-0189",
        "amount": 85000.0,
        "direction": "INFLOW",
        "type": "ORDER_PAYMENT",
        "timestamp": tx_outlier_time
    })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-TX-8291",
        "event_id": "TX-8291",
        "category": "UNUSUAL_TRANSACTION_AMOUNT",
        "entity_id": "TX-8291",
        "priority_score": 0.84,
        "priority": "HIGH",
        "signals": [
            "Amount deviation z-score = 8.42 against product baseline",
            "Single order value ₹85,000 exceeds 99.9th percentile",
            "Bulk quantity of 50 units on single residential consumer profile",
            "High chargeback liability risk"
        ],
        "description": "Transaction TX-8291 of ₹85,000 deviates 70.8x from average order baseline."
    })

    # -------------------------------------------------------------------------
    # Anomaly 5: Refund Spike on PROD-088
    # 8 consecutive refunds on PROD-088 in 48 hours
    # -------------------------------------------------------------------------
    rf_spike_start = datetime(2026, 9, 7, 10, 0, 0)
    for r_idx in range(7):
        refund_counter += 1
        r_time = rf_spike_start + timedelta(hours=r_idx * 5)
        refunds.append({
            "refund_id": f"RF-SPIKE-{r_idx+1}",
            "order_id": f"ORD-SPK-{r_idx+1}",
            "product_id": "PROD-088",
            "customer_id": customers[50 + r_idx],
            "amount": 2890.0,
            "reason": "Damaged / Defective Packaging",
            "timestamp": r_time.strftime("%Y-%m-%d %H:%M:%S")
        })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-REFUND-SPIKE",
        "event_id": "PROD-088",
        "category": "REFUND_SPIKE",
        "entity_id": "PROD-088",
        "priority_score": 0.76,
        "priority": "MEDIUM",
        "signals": [
            "Refund rate surged to 24.3% (historical baseline: 2.1%)",
            "7 refunds totaling ₹20,230 within 48 hours",
            "100% cited Damaged Packaging reason",
            "Carrier handling or packaging integrity issue"
        ],
        "description": "Refund spike on PROD-088 with 7 consecutive defect claims in 48 hours."
    })

    # -------------------------------------------------------------------------
    # Anomaly 6: Duplicate Platform Fee Deduction (FEE-9912 / FEE-9913)
    # -------------------------------------------------------------------------
    dup_fee_time = datetime(2026, 9, 9, 14, 0, 0).strftime("%Y-%m-%d %H:%M:%S")
    dup_fee_time_2 = datetime(2026, 9, 9, 14, 2, 30).strftime("%Y-%m-%d %H:%M:%S")
    fees.append({
        "fee_id": "FEE-9912",
        "order_id": "ORD-5520",
        "seller_id": SELLER_ID,
        "fee_type": "FBA_LONG_TERM_STORAGE",
        "amount": 4200.0,
        "timestamp": dup_fee_time
    })
    fees.append({
        "fee_id": "FEE-9913",
        "order_id": "ORD-5520",
        "seller_id": SELLER_ID,
        "fee_type": "FBA_LONG_TERM_STORAGE",
        "amount": 4200.0,
        "timestamp": dup_fee_time_2
    })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-DUP-FEE",
        "event_id": "FEE-9913",
        "category": "DUPLICATE_TRANSACTION",
        "entity_id": "FEE-9913",
        "priority_score": 0.72,
        "priority": "MEDIUM",
        "signals": [
            "Identical fee amount ₹4,200 charged twice within 150 seconds",
            "Duplicate reference key on ORD-5520",
            "Marketplace billing gateway re-try artifact",
            "Direct candidate for fee reimbursement claim"
        ],
        "description": "Potential duplicate marketplace storage fee deduction of ₹4,200 on order ORD-5520."
    })

    # -------------------------------------------------------------------------
    # Anomaly 7: Unusual Return Cluster (PROD-019)
    # -------------------------------------------------------------------------
    ret_cluster_time = datetime(2026, 9, 12, 16, 0, 0)
    for ret_i in range(5):
        return_counter += 1
        returns.append({
            "return_id": f"RET-CLUS-{ret_i+1}",
            "order_id": f"ORD-RC-{ret_i+1}",
            "product_id": "PROD-019",
            "customer_id": customers[100 + ret_i],
            "condition": "Carrier Damaged",
            "timestamp": (ret_cluster_time + timedelta(hours=ret_i * 3)).strftime("%Y-%m-%d %H:%M:%S")
        })

    ground_truth_anomalies.append({
        "anomaly_id": "ANOM-RETURN-CLUSTER",
        "event_id": "PROD-019",
        "category": "RETURN_CLUSTER",
        "entity_id": "PROD-019",
        "priority_score": 0.68,
        "priority": "MEDIUM",
        "signals": [
            "5 returns logged within 12 hours for SKU PROD-019",
            "Carrier damage status reported across all instances",
            "Temporal clustering score: 0.81",
            "Potential batch transit drop event"
        ],
        "description": "Localized return cluster on PROD-019 with 5 concurrent damage claims."
    })

    # Historical settlement batches for baseline comparison
    settlements.append({
        "settlement_id": "SET-1027",
        "seller_id": SELLER_ID,
        "period_start": "2026-08-01 00:00:00",
        "period_end": "2026-08-15 23:59:59",
        "expected_amount": 96800.0,
        "actual_amount": 96800.0,
        "difference": 0.0,
        "discrepancy_amount": 0.0,
        "status": "RECONCILED",
        "primary_entity": "NONE",
        "timestamp": "2026-08-16 08:30:00"
    })
    settlements.append({
        "settlement_id": "SET-1028",
        "seller_id": SELLER_ID,
        "period_start": "2026-08-16 00:00:00",
        "period_end": "2026-08-31 23:59:59",
        "expected_amount": 95400.0,
        "actual_amount": 95400.0,
        "difference": 0.0,
        "discrepancy_amount": 0.0,
        "status": "RECONCILED",
        "primary_entity": "NONE",
        "timestamp": "2026-09-01 08:30:00"
    })

    # Sort all by timestamp
    orders.sort(key=lambda x: x["timestamp"])
    transactions.sort(key=lambda x: x["timestamp"])
    fees.sort(key=lambda x: x["timestamp"])
    refunds.sort(key=lambda x: x["timestamp"])
    returns.sort(key=lambda x: x["timestamp"])

    # Write CSV files
    _write_csv(os.path.join(output_dir, "orders.csv"), orders)
    _write_csv(os.path.join(output_dir, "transactions.csv"), transactions)
    _write_csv(os.path.join(output_dir, "fees.csv"), fees)
    _write_csv(os.path.join(output_dir, "refunds.csv"), refunds)
    _write_csv(os.path.join(output_dir, "returns.csv"), returns)
    _write_csv(os.path.join(output_dir, "settlements.csv"), settlements)

    # Write ground truth anomalies
    gt_path = os.path.join(output_dir, "anomalies_ground_truth.json")
    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth_anomalies, f, indent=2)

    summary = {
        "orders_count": len(orders),
        "transactions_count": len(transactions),
        "fees_count": len(fees),
        "refunds_count": len(refunds),
        "returns_count": len(returns),
        "settlements_count": len(settlements),
        "anomalies_injected": len(ground_truth_anomalies),
        "flagship_discrepancy": 3300.0,
        "flagship_settlement": "SET-1029"
    }

    print(f"Dataset generated successfully in {output_dir}:")
    for k, v in summary.items():
        print(f"  - {k}: {v}")

    return summary

def _write_csv(filepath: str, data: List[Dict[str, Any]]):
    if not data:
        return
    headers = list(data[0].keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)

if __name__ == "__main__":
    generate_dataset("data")
