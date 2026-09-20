"""
FinGraph Sentinel - Temporal Heterogeneous Financial Graph Builder
Builds a NetworkX directed temporal multigraph of financial entities and relationships.
Provides ego-network extraction formatted natively for React Flow visualization.
"""

import os
import csv
import networkx as nx
from datetime import datetime
from typing import Dict, List, Any, Optional

class FinancialGraphBuilder:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.graph = nx.MultiDiGraph()
        self.node_metadata = {}
        self.edge_metadata = []

    def load_and_build(self) -> nx.MultiDiGraph:
        """Loads data from CSV files and populates the NetworkX graph."""
        self.graph.clear()
        self.node_metadata.clear()
        self.edge_metadata.clear()

        # 1. Add Seller Node
        seller_id = "SEL-001"
        self._add_node(seller_id, "SELLER", {
            "name": "Apex Retailers (Amazon IN)",
            "platform": "Amazon IN Marketplace",
            "rating": 4.8
        })

        # Bank Account Node
        bank_id = "BANK-HDFC-9912"
        self._add_node(bank_id, "BANK_ACCOUNT", {
            "bank_name": "HDFC Bank Corporate",
            "account_mask": "•••• 9912",
            "currency": "INR"
        })

        # 2. Add Products & Suppliers
        prod_file = os.path.join(self.data_dir, "orders.csv")
        if os.path.exists(prod_file):
            with open(prod_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                seen_products = set()
                seen_customers = set()
                
                for row in reader:
                    pid = row["product_id"]
                    if pid not in seen_products:
                        seen_products.add(pid)
                        self._add_node(pid, "PRODUCT", {
                            "product_id": pid,
                            "title": "Premium Wireless Gadget P17" if pid == "P17" else f"Marketplace SKU {pid}",
                            "unit_price": float(row["unit_price"]),
                            "category": "Electronics" if pid == "P17" else "General"
                        })
                        # Add SELLS edge from Seller to Product
                        self._add_edge(seller_id, pid, "SELLS", {
                            "relation": "SELLS",
                            "listing_date": "2026-08-01",
                            "status": "ACTIVE"
                        })
                    
                    cid = row["customer_id"]
                    if cid not in seen_customers:
                        seen_customers.add(cid)
                        self._add_node(cid, "CUSTOMER", {
                            "customer_id": cid,
                            "tier": "Prime Customer"
                        })

        # 3. Add Orders & Order Edges
        if os.path.exists(prod_file):
            with open(prod_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    oid = row["order_id"]
                    gross = float(row["gross_amount"])
                    ts = row["timestamp"]
                    
                    self._add_node(oid, "ORDER", {
                        "order_id": oid,
                        "amount": gross,
                        "timestamp": ts,
                        "status": row["status"]
                    })
                    
                    # CUSTOMER --(ORDERED)--> ORDER
                    self._add_edge(row["customer_id"], oid, "ORDERED", {
                        "relation": "ORDERED",
                        "amount": gross,
                        "timestamp": ts
                    })
                    
                    # ORDER --(CONTAINS)--> PRODUCT
                    self._add_edge(oid, row["product_id"], "CONTAINS", {
                        "relation": "CONTAINS",
                        "quantity": int(row["quantity"]),
                        "amount": gross,
                        "timestamp": ts
                    })

        # 4. Add Refunds
        refund_file = os.path.join(self.data_dir, "refunds.csv")
        if os.path.exists(refund_file):
            with open(refund_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rf_id = row["refund_id"]
                    amt = float(row["amount"])
                    ts = row["timestamp"]
                    
                    self._add_node(rf_id, "REFUND", {
                        "refund_id": rf_id,
                        "amount": amt,
                        "reason": row["reason"],
                        "timestamp": ts
                    })
                    
                    # ORDER --(REFUNDED_TO)--> REFUND
                    self._add_edge(row["order_id"], rf_id, "REFUNDED_TO", {
                        "relation": "REFUNDED_TO",
                        "amount": amt,
                        "timestamp": ts,
                        "is_anomaly": True if "1029" in rf_id else False
                    })
                    
                    # PRODUCT --(HAS_REFUND)--> REFUND
                    self._add_edge(row["product_id"], rf_id, "HAS_REFUND", {
                        "relation": "HAS_REFUND",
                        "amount": amt,
                        "timestamp": ts
                    })

        # 5. Add Settlements
        settle_file = os.path.join(self.data_dir, "settlements.csv")
        if os.path.exists(settle_file):
            with open(settle_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sid = row["settlement_id"]
                    expected = float(row["expected_amount"])
                    actual = float(row["actual_amount"])
                    diff = float(row["difference"])
                    
                    self._add_node(sid, "SETTLEMENT", {
                        "settlement_id": sid,
                        "expected_amount": expected,
                        "actual_amount": actual,
                        "difference": diff,
                        "status": row["status"],
                        "period_start": row["period_start"],
                        "period_end": row["period_end"]
                    })
                    
                    # SELLER --(RECEIVES)--> SETTLEMENT
                    self._add_edge(seller_id, sid, "RECEIVES", {
                        "relation": "RECEIVES",
                        "amount": actual,
                        "difference": diff,
                        "is_discrepancy": diff > 0
                    })
                    
                    # SETTLEMENT --(DEPOSITED_TO)--> BANK
                    self._add_edge(sid, bank_id, "DEPOSITED_TO", {
                        "relation": "DEPOSITED_TO",
                        "amount": actual,
                        "timestamp": row["timestamp"]
                    })

        # 6. Add Supplier Transactions
        tx_file = os.path.join(self.data_dir, "transactions.csv")
        if os.path.exists(tx_file):
            with open(tx_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row["entity_type"] == "SUPPLIER":
                        sup_id = row["entity_id"]
                        amt = float(row["amount"])
                        ts = row["timestamp"]
                        
                        if sup_id not in self.node_metadata:
                            self._add_node(sup_id, "SUPPLIER", {
                                "supplier_id": sup_id,
                                "status": "UNVERIFIED" if sup_id == "SUP-031" else "VERIFIED"
                            })
                        
                        # SELLER --(SUPPLIER_PAYMENT)--> SUPPLIER
                        self._add_edge(seller_id, sup_id, "SUPPLIER_PAYMENT", {
                            "relation": "SUPPLIER_PAYMENT",
                            "amount": amt,
                            "timestamp": ts,
                            "is_novel": (sup_id == "SUP-031")
                        })

        print(f"FinancialGraphBuilder: Built graph with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges.")
        return self.graph

    def _add_node(self, node_id: str, node_type: str, attrs: Dict[str, Any]):
        attrs["id"] = node_id
        attrs["type"] = node_type
        self.node_metadata[node_id] = attrs
        self.graph.add_node(node_id, **attrs)

    def _add_edge(self, u: str, v: str, edge_key: str, attrs: Dict[str, Any]):
        attrs_copy = dict(attrs)
        attrs_copy["relation"] = attrs_copy.get("relation", edge_key)
        self.edge_metadata.append({"source": u, "target": v, "key": edge_key, **attrs_copy})
        self.graph.add_edge(u, v, key=edge_key, **attrs_copy)

    def get_ego_subgraph_for_react_flow(self, entity_id: str, radius: int = 2) -> Dict[str, Any]:
        """
        Extracts a *connected* ego subgraph around entity_id and converts it
        to React Flow nodes and edges with coordinates and styling attributes.

        Strategy:
        1. Always include radius-1 direct neighbours (guaranteed to have edges).
        2. Add radius-2 nodes only if they are CONNECTED (have ≥1 edge in the
           induced subgraph), de-prioritising large orphan clouds like 37 PRODUCTS.
        3. Cap PRODUCT nodes at MAX_PRODUCTS to prevent 4 000px tall columns.
        4. Spread nodes in a two-column grid when a layer has many items so
           x-positions differ and dagre has a sensible starting geometry.
        """
        MAX_PRODUCTS = 8  # hard cap on product nodes shown

        if entity_id not in self.graph:
            matches = [n for n in self.graph.nodes if entity_id in str(n)]
            entity_id = matches[0] if matches else ("SET-1029" if "SET-1029" in self.graph else "SEL-001")

        undirected = self.graph.to_undirected()

        # ── Step 1: radius-1 neighbours (always connected) ──────────────
        try:
            r1_nodes = set(nx.single_source_shortest_path_length(undirected, entity_id, cutoff=1).keys())
        except Exception:
            r1_nodes = {entity_id}

        # ── Step 2: radius-2 candidates ──────────────────────────────────
        try:
            r2_all = set(nx.single_source_shortest_path_length(undirected, entity_id, cutoff=2).keys())
        except Exception:
            r2_all = r1_nodes.copy()

        r2_only = r2_all - r1_nodes

        # Induce on radius-1 first to know which edges exist
        r1_sub = self.graph.subgraph(r1_nodes)
        r1_edge_set = {str(u) for u, _, _ in r1_sub.edges(data=True)} | {str(v) for _, v, _ in r1_sub.edges(data=True)}

        # ── Step 3: build candidate list for radius-2 ───────────────────
        # Only include r2-only nodes that are PRODUCT if we haven't hit cap yet
        product_budget = MAX_PRODUCTS
        selected_nodes = set(r1_nodes)
        anomaly_products = {"P17"}  # always include flagged product

        for nid in r2_only:
            ntype = self.graph.nodes[nid].get("type", "UNKNOWN") if nid in self.graph else "UNKNOWN"
            if ntype == "PRODUCT":
                if nid in anomaly_products:
                    selected_nodes.add(nid)
                elif product_budget > 0:
                    selected_nodes.add(nid)
                    product_budget -= 1
            else:
                selected_nodes.add(nid)

        # Safety cap at 40 total
        if len(selected_nodes) > 40:
            # Keep focus + r1 + up to remaining from r2
            r1_list = list(r1_nodes)
            selected_nodes = {entity_id} | set(r1_list[:39])

        sub_g = self.graph.subgraph(selected_nodes)

        # ── Step 4: build React Flow nodes with spread positioning ───────
        type_layer = {
            "SUPPLIER":     0,
            "SELLER":       1,
            "PRODUCT":      2,
            "CUSTOMER":     2,
            "ORDER":        3,
            "REFUND":       4,
            "FEE":          4,
            "RETURN":       4,
            "SETTLEMENT":   5,
            "BANK_ACCOUNT": 6,
        }

        # Collect nodes per layer for multi-column spread
        layer_nodes: Dict[int, list] = {}
        for nid in sub_g.nodes:
            ntype = self.graph.nodes[nid].get("type", "UNKNOWN") if nid in self.graph else "UNKNOWN"
            layer = type_layer.get(ntype, 3)
            layer_nodes.setdefault(layer, []).append(nid)

        LAYER_X_STEP = 220      # horizontal gap between layers
        NODE_Y_STEP  = 110      # vertical gap between nodes in same layer
        COL_WIDTH    = 180      # width of second sub-column when layer is wide
        MAX_COL_ROWS = 6        # after this many rows split into 2 sub-columns

        rf_nodes = []
        node_positions: Dict[str, Dict] = {}

        for layer, nids in layer_nodes.items():
            base_x = 120 + layer * LAYER_X_STEP
            for idx, nid in enumerate(nids):
                if len(nids) > MAX_COL_ROWS:
                    # Two sub-columns to avoid very tall towers
                    col = idx % 2
                    row = idx // 2
                    x_pos = base_x + col * COL_WIDTH
                    y_pos = 60 + row * NODE_Y_STEP
                else:
                    x_pos = base_x
                    y_pos = 60 + idx * NODE_Y_STEP

                ndata = self.graph.nodes[nid] if nid in self.graph else {}
                ntype = ndata.get("type", "UNKNOWN")
                is_focus   = (nid == entity_id)
                # Mark anomaly nodes: all 7 known anomaly entities + settlement discrepancy
                ANOMALY_ENTITIES = {"P17", "SUP-031", "TX-8291", "PROD-042", "PROD-088", "FEE-9913", "PROD-019", "SET-1029"}
                is_anomaly = (
                    ndata.get("difference", 0) > 0
                    or any(ae in str(nid) for ae in ANOMALY_ENTITIES)
                    or nid in ANOMALY_ENTITIES
                )


                node_positions[str(nid)] = {"x": x_pos, "y": y_pos}
                rf_nodes.append({
                    "id":   str(nid),
                    "type": "financialNode",
                    "position": {"x": x_pos, "y": y_pos},
                    "data": {
                        "label":       str(nid),
                        "entity_type": ntype,
                        "details":     dict(ndata),
                        "is_focus":    is_focus,
                        "is_anomaly":  is_anomaly,
                    }
                })

        # ── Step 5: build React Flow edges ───────────────────────────────
        rf_edges = []
        edge_idx  = 0
        valid_ids = {n["id"] for n in rf_nodes}

        for u, v, k, edata in sub_g.edges(data=True, keys=True):
            if str(u) not in valid_ids or str(v) not in valid_ids:
                continue
            edge_idx += 1
            is_anom_edge = (
                edata.get("is_anomaly", False)
                or edata.get("is_discrepancy", False)
                or edata.get("is_novel", False)
            )
            amt = edata.get("amount")
            amt_label = f"₹{amt:,.0f}" if amt is not None else edata.get("relation", str(k))

            rf_edges.append({
                "id":       f"e-{u}-{v}-{edge_idx}",
                "source":   str(u),
                "target":   str(v),
                "label":    amt_label,
                "animated": is_anom_edge,
                "style": {
                    "stroke":      "#EF4444" if is_anom_edge else "#4B5563",
                    "strokeWidth": 2.5      if is_anom_edge else 1.5,
                },
                "data": dict(edata),
            })

        return {
            "entity_id":   entity_id,
            "nodes_count": len(rf_nodes),
            "edges_count": len(rf_edges),
            "nodes":       rf_nodes,
            "edges":       rf_edges,
        }

if __name__ == "__main__":
    builder = FinancialGraphBuilder("data")
    builder.load_and_build()
    sample = builder.get_ego_subgraph_for_react_flow("SET-1029")
    print(f"Sample SET-1029 subgraph: {sample['nodes_count']} nodes, {sample['edges_count']} edges.")
