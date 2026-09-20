# FinGraph Sentinel — Research Foundation & Academic Context

**Academic Focus:** Practical adaptation of dynamic heterogeneous graph modeling, explainable anomaly detection, and controlled agentic AI for SME marketplace financial operations.

---

## 1. Problem Background
Small-to-medium enterprise (SME) marketplace sellers operate in high-velocity environments with tight operating margins (typically 8%–18%). Sellers encounter complex financial reconciliation challenges across hundreds of daily micro-transactions:
- Subtle discrepancies in settlement disbursements
- Clustered return and refund deductions
- Shifting platform fee schedules
- Unmonitored supplier invoice anomalies

In enterprise banking and payment processing, fraud detection and financial reconciliation have increasingly moved toward graph neural networks (GNNs) and temporal sequence modeling. However, marketplace sellers remain underserved: commercial seller dashboards provide only static scalar tables (aggregating monthly GMV, gross returns, and disbursement totals) without relational context. When discrepancies arise, small business operators lack the specialized forensic data teams or audit tools required to trace root causes through interconnected relational paths.

---

## 2. Core Research Themes & Academic Foundations

### Research Theme 1: Dynamic Heterogeneous Graph Learning in Financial Systems
- **Research Insight:** Financial transactions do not exist in isolation; they form a continuously evolving heterogeneous information network (HIN) involving diverse node types (sellers, customers, products, suppliers, settlements, bank accounts) and multiplex edge relations (ordered, refunded, supplied, deposited).
- **Existing Research Work:** Recent literature (e.g., dynamic financial fraud detection architectures in *Scientific Reports*, 2026) demonstrates that static graph snapshots fail to capture temporal dependencies and evolving collusion patterns. Dynamic heterogeneous graphs model transactions as discrete temporal snapshots or continuous event streams to detect sudden topology changes.
- **Limitations for SMEs:** Enterprise dynamic GNNs (e.g., T-GCN, DyHAT) require massive GPU clusters, extensive labeled training corpora (which SMEs rarely possess), and high-latency inference that cannot run cost-effectively within serverless micro-budgets.

### Research Theme 2: Explainable Graph-Based Anomaly Detection (XAI in Finance)
- **Research Insight:** In high-stakes financial environments, a raw risk score (e.g., `Risk = 0.91`) is insufficient and untrustworthy. Decision-makers require interpretable evidence attributing the anomaly to specific structural components (subgraphs, temporal spikes, or novel connections).
- **Existing Research Work:** Systematic reviews of transparent financial AI (2026) emphasize feature attribution, GNNExplainer subgraph masks, and interpretable rule-based decomposition over black-box predictions.
- **Limitations for SMEs:** Deep feature attribution techniques generate dense gradient or mutual information matrices that are impenetrable to non-technical business operators. Sellers need clear, business-grounded reasons (e.g., *"Refund velocity increased 2.7× on SKU P17"*).

### Research Theme 3: Controlled Agentic Systems for Financial Analysis
- **Research Insight:** Large Language Models (LLMs) excel at synthesizing complex narrative explanations from contextual evidence, but are inherently prone to mathematical hallucination and numerical drift when performing financial calculations.
- **Existing Research Work:** Recent SME-finance agentic frameworks (June 2026) advocate for a dual-tier separation of concerns:
  1. A **deterministic retrieval/calculation tier** governed by immutable code tools.
  2. A **grounded generative explanation tier** that reasons strictly over verified tool outputs.
- **Limitations for SMEs:** Unconstrained multi-agent swarms introduce compounding token costs, nondeterministic tool execution loops, and orchestration latency unsuitable for real-time seller workflows.

---

## 3. What FinGraph Sentinel Adapts

FinGraph Sentinel bridges the gap between academic graph anomaly research and real-world SME marketplace utility:

```
Academic Graph Research           Marketplace SME Challenge            FinGraph Sentinel Adaptation
───────────────────────────────────────────────────────────────────────────────────────────────────
Dynamic GNNs (GPU-heavy)    ──►   Zero GPU budget, sparse labels  ──►  Lightweight Temporal Heterogeneous
                                                                       Graph (NetworkX) + Velocity Tracking

Complex Gradient Attribution──►   Non-technical seller persona    ──►  Interpretable Multi-Signal Scoring
                                                                       (Amount, Frequency, Novelty, Clusters)

Uncontrolled LLM Chatbots   ──►   Financial hallucination risk    ──►  Strands Agent SDK + Deterministic Tools
                                                                       (LLM acts as narrative reasoner only)
```

1. **Lightweight Heterogeneous Temporal Representation:** Rather than deploying an opaque neural model, we construct a 10-node-type temporal graph using `NetworkX` that tracks transaction timestamps, edge frequencies, and running baselines in memory.
2. **Interpretable Multi-Signal Formulation:** We adapt topological and temporal anomaly signals into a transparent, normalized scoring function:
   - *Amount Deviation* ($A_{\text{dev}}$)
   - *Frequency Velocity Change* ($F_{\text{chg}}$)
   - *Relationship Novelty* ($R_{\text{nov}}$)
   - *Temporal Window Clustering* ($T_{\text{clust}}$)
   - *Multi-Cycle Historical Deviation* ($H_{\text{dev}}$)
   - *Neighborhood Degree Perturbation* ($G_{\text{chg}}$)
3. **Controlled Grounded Agentic Workflow:** We adapt the controlled SME agentic paradigm by implementing a strict Strands Agent orchestrator backed by Amazon Bedrock. The model cannot alter financial data or generate numbers; it executes verified Python tools to fetch immutable metrics and formats the explanation for human decision-support.

---

## 4. What FinGraph Sentinel Contributes (System-Level Innovation)

> [!NOTE]
> **Defensible Innovation Statement:**  
> We do **not** claim to have invented graph-based anomaly detection or foundational agent architectures. Our defensible contribution is a **practical, grounded financial investigation system** that integrates temporal relational analysis, interpretable anomaly evidence, and a serverless agentic workflow tailored to the operational realities of marketplace sellers.

### Concrete System Contributions:
1. **End-to-End Seller Reconciliation Graph:** The first lightweight implementation connecting raw marketplace orders, fees, refunds, and bi-weekly settlements into an explicit bipartite/heterogeneous temporal graph.
2. **Deterministic Evidence Engine:** A dedicated layer (`evidence_engine.py`) that bridges mathematical anomaly detection and LLM reasoning by synthesizing structured, auditable evidence packets.
3. **Sub-Second Ego-Network Extraction for Web UI:** Real-time extraction of 1-to-2 hop anomaly subgraphs formatted natively for React Flow visualization, allowing sellers to visually verify the relationships flagged by the AI.

---

## 5. Prototype Limitations & Future Research Directions

### Current Limitations:
- **Synthetic Calibration:** Evaluated on realistic synthetic seller data (~10,000 transactions) rather than live production Seller Central feeds.
- **In-Memory Graph Representation:** NetworkX graph operates in Lambda/FastAPI memory, which is ideal for single-seller workloads (<100,000 nodes) but requires distributed graph databases (e.g., Amazon Neptune) for multi-tenant enterprise scale.
- **Rule-Calibrated Weights:** The multi-signal weights are heuristically tuned based on retail margin variance rather than end-to-end gradient descent.

### Future Research Directions:
- **Streaming Temporal Graph Ingestion:** Integrating Amazon Kinesis and Neptune for millisecond-latency transaction ingestion.
- **Graph Neural Network Distillation:** Distilling trained dynamic GNN embeddings into fast tabular tree models for edge deployment.
- **Collaborative Cross-Seller Benchmarking:** Federated anomaly baseline sharing among merchants without leaking proprietary supplier pricing.

---

## 6. Selected References
1. *Dynamic Heterogeneous Graph Neural Networks for Financial Fraud Detection under Label Scarcity*, Scientific Reports, 2026.
2. *Transparent and Explainable Financial AI: A Systematic Review of Graph Learning and Explainability in Credit Risk and Fraud Detection*, Financial Innovation & AI Review, July 2026.
3. *Controlled Agentic Systems for SME Financial Risk Analysis: Separating Deterministic Ingestion from LLM Interpretation*, ACM Transactions on Management Information Systems, June 2026.
4. *Temporal Graph Networks for Deep Learning on Dynamic Graphs*, Rossi et al., ICML Workshop, 2020.
5. *GNNExplainer: Generating Explanations for Graph Neural Networks*, Ying et al., NeurIPS, 2019.
