# FinGraph Sentinel — Engineering Architecture & Specification

**System Vision:** Serverless, explainable, graph-augmented financial intelligence deployed on AWS for the First Commit 2026 Hackathon (SHIP IT Track).

---

## 1. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER CLIENT (BROWSER)                         │
│   React 18 + Vite + TypeScript + Tailwind CSS + Recharts + React Flow  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           AWS AMPLIFY HOSTING                          │
│          Global CDN Distribution, SSL Termination, CI/CD Builds        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         AMAZON API GATEWAY                             │
│                  HTTP API (Proxy to AWS Lambda Backend)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Event / Context
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AWS LAMBDA (FastAPI + Mangum)                   │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Intelligence Engine   │  │ Temporal Graph   │  │ Evidence Engine │  │
│  │ Anomaly Detection     │  │ (NetworkX Core)  │  │ Deterministic   │  │
│  └──────────┬────────────┘  └────────┬─────────┘  └────────┬────────┘  │
│             │                        │                     │           │
│             └────────────────────────┼─────────────────────┘           │
│                                      ▼                                 │
│                       ┌──────────────────────────────┐                 │
│                       │   Strands Agents SDK Layer   │                 │
│                       │   - Tool Registry (11 Tools) │                 │
│                       │   - Guardrail Validation     │                 │
│                       └──────────────┬───────────────┘                 │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│    AMAZON DYNAMODB    │  │       AMAZON S3       │  │    AMAZON BEDROCK     │
│  - Financial Entities │  │  - Raw CSV Records    │  │  - Claude 3.5 Sonnet  │
│  - Transactions       │  │  - Graph Snapshots    │  │  - Grounded Reasoning │
│  - Anomaly Audit Log  │  │  - Generated Reports  │  │  - Tool Invocation    │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

---

## 2. Directory Structure

```text
fingraph-sentinel/
├── AGENTS.md                  # Agent architecture & tool registry guide
├── product.md                 # Product specifications & user problem
├── ui.md                      # UI/UX design tokens & screen definitions
├── engineering.md             # System architecture & technical specs
├── research.md                # Research foundation & academic synthesis
├── README.md                  # Hackathon pitch, deployment, & demo guide
│
├── frontend/                  # React + Vite + Tailwind + React Flow UI
│   ├── public/                # Static assets, logos, sample CSVs
│   ├── src/
│   │   ├── components/        # UI components (KPI cards, charts, drawer)
│   │   ├── views/             # Dashboard, Anomalies, GraphExplorer, Upload
│   │   ├── services/          # API client & AWS Amplify integration
│   │   ├── types/             # TypeScript data contracts & schemas
│   │   ├── App.tsx            # Main application layout
│   │   └── main.tsx           # Application entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                   # Serverless FastAPI Backend
│   ├── app.py                 # FastAPI application with Mangum handler
│   ├── requirements.txt       # Python dependencies
│   ├── services/
│   │   ├── data_service.py    # Local/DynamoDB data abstraction
│   │   └── s3_service.py      # S3 ingestion & storage client
│   ├── models/
│   │   └── schemas.py         # Pydantic models for request/response
│   └── tests/
│       ├── test_intelligence.py # Unit tests for data & graph
│       ├── test_anomaly.py      # Unit tests for scoring algorithms
│       └── test_api.py          # FastAPI endpoint integration tests
│
├── intelligence/              # Financial Graph & Anomaly Intelligence
│   ├── dataset_generator.py   # Realistic ~10,000 row generator + injected anomalies
│   ├── graph_builder.py       # NetworkX temporal heterogeneous graph builder
│   ├── features.py            # Temporal & topological feature extractor
│   ├── anomaly_detector.py    # Multi-signal hybrid anomaly scoring engine
│   ├── evidence_engine.py     # Deterministic evidence calculation & packaging
│   └── evaluation.py          # Precision/Recall/F1 benchmark vs baseline
│
├── agent/                     # Strands Agents SDK & Bedrock Layer
│   ├── agent.py               # Strands agent orchestrator & execution loop
│   ├── tools.py               # 11 deterministic financial retrieval tools
│   └── prompts.py             # Guardrailed system prompts & output formatters
│
├── infrastructure/            # Infrastructure as Code
│   ├── template.yaml          # AWS SAM template (API Gateway, Lambda, DynamoDB, S3)
│   └── samconfig.toml         # SAM deployment configuration
│
└── data/                      # Demo dataset repository (~10k rows)
    ├── orders.csv
    ├── transactions.csv
    ├── refunds.csv
    ├── returns.csv
    ├── fees.csv
    └── settlements.csv
```

---

## 3. Data Model & Temporal Graph Specification

### Node Entities
- `SELLER`: Primary merchant node (`seller_id`)
- `CUSTOMER`: End consumer (`customer_id`, historical purchase velocity)
- `PRODUCT`: Catalog item (`product_id`, category, return rate baseline)
- `SUPPLIER`: Inventory vendor (`supplier_id`, tenure, historical payout sum)
- `ORDER`: Purchase transaction (`order_id`, timestamp, gross amount)
- `REFUND`: Post-purchase credit (`refund_id`, reason, amount, linked order)
- `RETURN`: Physical inventory return (`return_id`, condition, linked order)
- `FEE`: Platform deduction (`fee_id`, type: referral/fba/storage, amount)
- `SETTLEMENT`: Disbursement batch (`settlement_id`, period, gross, deductions, net)
- `BANK_ACCOUNT`: Merchant deposit account (`account_id`, masked bank info)

### Directed Edges & Temporal Attributes
| Edge Type | Source Node | Target Node | Attributes |
| :--- | :--- | :--- | :--- |
| `SELLS` | `SELLER` | `PRODUCT` | `listing_date`, `active_status` |
| `ORDERED` | `CUSTOMER` | `ORDER` | `timestamp`, `amount`, `payment_method` |
| `CONTAINS` | `ORDER` | `PRODUCT` | `quantity`, `unit_price` |
| `SUPPLIED_BY` | `PRODUCT` | `SUPPLIER` | `contract_date`, `unit_cost` |
| `CHARGED_FEE` | `ORDER` | `FEE` | `timestamp`, `fee_type`, `rate` |
| `REFUNDED_TO` | `ORDER` | `REFUND` | `timestamp`, `amount`, `refund_reason` |
| `RETURNED` | `ORDER` | `RETURN` | `timestamp`, `return_status` |
| `INCLUDED_IN_SETTLEMENT` | `ORDER`/`REFUND`/`FEE` | `SETTLEMENT`| `cycle_id`, `reconciliation_status` |
| `DEPOSITED_TO` | `SETTLEMENT` | `BANK_ACCOUNT`| `timestamp`, `cleared_amount` |

---

## 4. Anomaly Engine & Scoring Formula

The anomaly engine calculates an **Interpretable Priority Score** \( S \in [0, 1] \):

$$S = w_1 \cdot A_{\text{dev}} + w_2 \cdot F_{\text{chg}} + w_3 \cdot R_{\text{nov}} + w_4 \cdot T_{\text{clust}} + w_5 \cdot H_{\text{dev}} + w_6 \cdot G_{\text{chg}}$$

Default normalized weights (\(\sum w_i = 1.0\)):
- \( w_1 = 0.25 \) : **Amount Deviation** (\( A_{\text{dev}} \)) — Z-score deviation of transaction/settlement vs historical mean.
- \( w_2 = 0.20 \) : **Frequency Change** (\( F_{\text{chg}} \)) — Rate of events per unit time compared with rolling 30-day average.
- \( w_3 = 0.20 \) : **Relationship Novelty** (\( R_{\text{nov}} \)) — Degree of edge freshness (e.g., supplier with 0 prior transactions = 1.0).
- \( w_4 = 0.15 \) : **Temporal Clustering** (\( T_{\text{clust}} \)) — Shannon entropy of timestamps within a sliding 72-hour window.
- \( w_5 = 0.10 \) : **Historical Deviation** (\( H_{\text{dev}} \)) — Discrepancy against multi-cycle reconciliation baselines.
- \( w_6 = 0.10 \) : **Graph Change** (\( G_{\text{chg}} \)) — Local node degree perturbation in the ego-network.

### Priority Classification
- **HIGH PRIORITY REVIEW**: \( S \ge 0.70 \)
- **MEDIUM PRIORITY REVIEW**: \( 0.45 \le S < 0.70 \)
- **LOW PRIORITY REVIEW**: \( S < 0.45 \)

---

## 5. REST API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck and service status (AWS Bedrock, DB, Graph) |
| `GET` | `/dashboard` | Aggregate financial KPIs (Sales, Fees, Refunds, Net, Settlement, Anomaly counts) |
| `GET` | `/anomalies` | List of all flagged financial anomalies with priority scores and signals |
| `GET` | `/anomalies/{id}` | Detailed anomaly record with evidence payload and signal breakdown |
| `GET` | `/transactions/{id}`| Entity transaction details by ID |
| `GET` | `/settlements/{id}` | Settlement breakdown (expected vs actual, orders, fees, refunds) |
| `GET` | `/graph/{entity_id}`| Ego-subgraph nodes and edges formatted for React Flow |
| `POST`| `/investigate` | Triggers Strands Agent Bedrock investigation for a specific anomaly ID |
| `POST`| `/upload` | Multipart CSV upload for orders, fees, refunds, and settlements |
| `GET` | `/demo/load` | Resets dataset to deterministic 10,000-row demo scenario (SET-1029) |

---

## 6. The 11 Strands Agent Deterministic Tools

1. `get_transaction(transaction_id: str)`: Returns immutable transaction details.
2. `get_order_history(identifier: str)`: Returns historical orders for an order ID or product ID.
3. `get_product_history(product_id: str)`: Returns product sales, returns, and refund ratios.
4. `get_supplier_history(supplier_id: str)`: Returns supplier tenure, total payout volume, and historical frequency.
5. `get_refund_history(identifier: str)`: Returns itemized refund logs for a product or order.
6. `get_return_history(identifier: str)`: Returns physical return logs and item inspection statuses.
7. `get_fee_summary(period: str)`: Returns breakdown of platform fees (referral, fulfillment, storage).
8. `get_settlement(settlement_id: str)`: Returns actual disbursement payload from marketplace.
9. `calculate_expected_settlement(settlement_id: str)`: Deterministically calculates:  
   $$\text{Expected} = \text{Gross Sales} - \text{Fees} - \text{Refunds} \pm \text{Adjustments}$$
10. `get_anomaly_evidence(event_id: str)`: Retrieves the verified evidence dictionary produced by `evidence_engine.py`.
11. `get_financial_summary(period: str)`: Returns macro financial metrics for a designated period.

---

## 7. Amazon Bedrock & Strands Agent Guardrails
- **Model:** Anthropic Claude 3.5 Sonnet / Amazon Nova via Amazon Bedrock.
- **Guardrail Layer:**
  - Strict system prompt enforcing factual fidelity.
  - LLM is strictly prohibited from executing state-modifying actions or calculating arbitrary financial numbers.
  - Every numerical metric cited in the narrative **must** originate from a tool return value.
  - Zero-accusation constraint: Output must frame findings as decision-support insights requiring human review.
