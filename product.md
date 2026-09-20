# FinGraph Sentinel — Product Specification

**Tagline:** *“See the relationship. Understand the anomaly. Decide what to review.”*

---

## 1. Product Overview & Vision
**FinGraph Sentinel** is an explainable AI financial investigation system designed specifically for small-to-medium enterprise (SME) marketplace sellers (such as Amazon Marketplace-style third-party merchants).

Modern e-commerce operators generate thousands of transactions across multiple disconnected operational silos:
- Customer orders and catalog items
- Platform referral, fulfillment, and closing fees
- Customer returns and refund deductions
- Supplier inventory procurement payments
- Bi-weekly marketplace disbursement settlements
- Bank account deposits

Traditional seller dashboards present these as isolated flat tables and aggregate charts. When a seller notices their disbursement is lower than anticipated, they are forced to manually correlate CSV reports, cross-reference order IDs, and guess why margins collapsed.

**FinGraph Sentinel** connects these disparate records into a **temporal financial relationship graph**, detects anomalous patterns using interpretable relational signals, and deploys a **grounded AI investigation agent** to assemble verified evidence and present human-readable explanations.

> [!IMPORTANT]
> **Decision-Support Guardrail:** FinGraph Sentinel is strictly a **decision-support and investigation system**. The AI does **NOT** declare fraud, accuse individuals or suppliers, or execute financial transfers. The human seller remains the sole authority for financial and business decisions.

---

## 2. The Four Core Product Questions
FinGraph Sentinel is architected to answer four essential business questions for every financial cycle:

1. **What changed?**  
   *Quantifies week-over-week shifts in gross sales, fee rates, return volumes, and settlement amounts.*
2. **What looks unusual?**  
   *Surfaces prioritized financial events deviating from temporal or topological baselines.*
3. **Why is it unusual?**  
   *Attributes the anomaly to concrete structural drivers (e.g., concentrated refund velocity on a specific SKU or rapid payment spikes to an unverified supplier).*
4. **What should I review?**  
   *Provides clear, actionable guidance specifying the exact orders, settlement entries, or supplier invoices requiring human audit.*

---

## 3. The Three Core MVP Capabilities

### Capability A — Financial Control Dashboard
Provides immediate situational awareness over the seller's financial health:
- **Gross Sales**: Total GMV across all completed customer orders.
- **Platform Fees**: Breakdown of marketplace referral, FBA, and storage fees.
- **Refunds & Returns**: Aggregate refunded value and physical return rates.
- **Net Revenue**: Realized earnings before payout reconciliation.
- **Settlement Amount**: Actual disbursed funds versus model-calculated expected payouts.
- **Anomaly Counter & Banner**: Immediate visual alert (e.g., *"7 financial events require review"*).

### Capability B — Temporal Anomaly Detection Engine
Surfaces anomalies using transparent, multi-signal scoring:
1. **Settlement Discrepancy**: Mismatch between computed net accruals and marketplace disbursement amounts.
2. **Refund Spikes**: Sudden acceleration of refund amounts or rates for a product or category.
3. **Unusual Transaction Amounts**: Extreme deviation from historical SKU or customer baselines.
4. **New Supplier Relationships**: Rapid creation of high-value payment links without historical relationship build-up.
5. **Transaction Bursts**: High-frequency ordering or payment clustering within narrow temporal windows (<72 hours).

### Capability C — Grounded AI Investigation Agent
- When a seller clicks **"Investigate"** on any flagged event, the agent executes deterministic tools to fetch immutable data from the financial graph.
- The agent displays a live progress trace (*Settlement retrieved → Historical settlements compared → Refunds analyzed → Product relationship checked → Discrepancy calculated*).
- The agent generates a structured, non-hallucinatory finding with concrete financial impact and review recommendations.

---

## 4. Flagship Demo Scenario: Settlement SET-1029
- **Event ID:** `SET-1029`
- **Period:** Bi-weekly settlement cycle
- **Expected Settlement:** ₹94,500
- **Actual Settlement Disbursed:** ₹91,200
- **Discrepancy:** ₹3,300 shortfall
- **Structural Driver:** A 2.7× spike in customer refund activity specifically concentrated on **Product P17** occurring within a 72-hour window prior to settlement cutoff.
- **Agent Output:**
  - **Finding:** The settlement disbursed is ₹3,300 below calculated net proceeds.
  - **Evidence:** 3 customer refunds totaling ₹3,300 linked to Product P17 were processed between Sept 14 and Sept 16, inflating the refund deduction rate to 2.7× baseline.
  - **Recommended Review:** Audit batch quality for Product P17 and confirm whether return units were physically received at the fulfillment center.

---

## 5. Product Language Standards
To ensure professional compliance and prevent misleading claims:
- **Approved Terms:** *"Financial anomaly"*, *"Requires review"*, *"Discrepancy"*, *"Unusual pattern"*, *"Evidence indicates"*, *"Decision support"*.
- **Prohibited Terms:** *"Guaranteed fraud"*, *"Fraud confirmed"*, *"Criminal activity"*, *"Stolen funds"*, *"Guilty party"*.
