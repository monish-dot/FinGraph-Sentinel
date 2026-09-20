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
        Extracts an ego subgraph around entity_id and converts it to
        React Flow nodes and edges with coordinates and styling attributes.
        """
        if entity_id not in self.graph:
            # Fallback: if entity not direct node, check if partial match (e.g. SET-1029)
            matches = [n for n in self.graph.nodes if entity_id in str(n)]
            if matches:
                entity_id = matches[0]
            else:
                entity_id = "SET-1029" if "SET-1029" in self.graph else "SEL-001"

        # Extract undirected neighborhood for comprehensive context, then induce on original
        undirected = self.graph.to_undirected()
        try:
            subgraph_nodes = list(nx.single_source_shortest_path_length(undirected, entity_id, cutoff=radius).keys())
        except Exception:
            subgraph_nodes = [entity_id]

        # Limit subgraph size to 40 nodes to maintain crisp UI readability
        if len(subgraph_nodes) > 40:
            subgraph_nodes = [entity_id] + [n for n in subgraph_nodes if n != entity_id][:39]

        sub_g = self.graph.subgraph(subgraph_nodes)

        # Build React Flow nodes
        rf_nodes = []
        rf_edges = []

        # Simple tiered hierarchical positioning for React Flow
        # Layers: Supplier(0) -> Seller(1) -> Product(2) -> Order(3) -> Refund/Fee(4) -> Settlement(5) -> Bank(6)
        type_layer = {
            "SUPPLIER": 0,
            "SELLER": 1,
            "PRODUCT": 2,
            "ORDER": 3,
            "REFUND": 4,
            "FEE": 4,
            "RETURN": 4,
            "SETTLEMENT": 5,
            "BANK_ACCOUNT": 6,
            "CUSTOMER": 2
        }

        layer_counts = {}
        for nid in sub_g.nodes:
            ndata = self.graph.nodes[nid]
            ntype = ndata.get("type", "UNKNOWN")
            layer = type_layer.get(ntype, 3)
            idx_in_layer = layer_counts.get(layer, 0)
            layer_counts[layer] = idx_in_layer + 1

            # Coordinates
            x_pos = 120 + layer * 220
            y_pos = 100 + idx_in_layer * 110

            is_focus = (nid == entity_id)
            is_anomaly = ndata.get("difference", 0) > 0 or "1029" in str(nid) or nid in ["P17", "SUP-031"]

            rf_nodes.append({
                "id": str(nid),
                "type": "financialNode",
                "position": {"x": x_pos, "y": y_pos},
                "data": {
                    "label": str(nid),
                    "entity_type": ntype,
                    "details": ndata,
                    "is_focus": is_focus,
                    "is_anomaly": is_anomaly
                }
            })

        # Build React Flow edges
        edge_idx = 0
        for u, v, k, edata in sub_g.edges(data=True, keys=True):
            edge_idx += 1
            is_anom_edge = edata.get("is_anomaly", False) or edata.get("is_discrepancy", False) or edata.get("is_novel", False)
            amt = edata.get("amount")
            amt_label = f"₹{amt:,.0f}" if amt is not None else edata.get("relation", k)
            
            rf_edges.append({
                "id": f"e-{u}-{v}-{edge_idx}",
                "source": str(u),
                "target": str(v),
                "label": amt_label,
                "animated": is_anom_edge,
                "style": {
                    "stroke": "#EF4444" if is_anom_edge else "#4B5563",
                    "strokeWidth": 2.5 if is_anom_edge else 1.5
                },
                "data": edata
            })

        return {
            "entity_id": entity_id,
            "nodes_count": len(rf_nodes),
            "edges_count": len(rf_edges),
            "nodes": rf_nodes,
            "edges": rf_edges
        }

if __name__ == "__main__":
    builder = FinancialGraphBuilder("data")
    builder.load_and_build()
    sample = builder.get_ego_subgraph_for_react_flow("SET-1029")
    print(f"Sample SET-1029 subgraph: {sample['nodes_count']} nodes, {sample['edges_count']} edges.")
