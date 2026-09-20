"""
FinGraph Sentinel - Temporal & Topological Feature Extractor
Computes interpretable signals for financial events:
1. amount_deviation
2. frequency_change
3. relationship_novelty
4. temporal_clustering
5. historical_deviation
6. graph_change
"""

import math
from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np

class FeatureExtractor:
    def __init__(self, historical_window_days: int = 30):
        self.historical_window_days = historical_window_days

    def compute_amount_deviation(self, amount: float, baseline_amounts: List[float]) -> float:
        """
        Computes normalized amount deviation score [0.0, 1.0].
        Uses robust z-score mapped through sigmoid.
        """
        if not baseline_amounts:
            return 0.5
        arr = np.array(baseline_amounts, dtype=float)
        median = float(np.median(arr))
        mad = float(np.median(np.abs(arr - median)))
        if mad < 1e-4:
            std = float(np.std(arr))
            spread = std if std > 1e-4 else 1.0
        else:
            spread = 1.4826 * mad

        z = abs(amount - median) / spread
        # Sigmoid normalization: z=0 -> 0.0, z=3 -> 0.76, z=6 -> 0.97
        normalized = 2.0 / (1.0 + math.exp(-0.5 * z)) - 1.0
        return round(float(np.clip(normalized, 0.0, 1.0)), 4)

    def compute_frequency_change(self, current_period_count: int, baseline_period_avg: float) -> float:
        """
        Computes transaction velocity shift [0.0, 1.0].
        """
        if baseline_period_avg <= 0:
            return 0.8 if current_period_count > 0 else 0.0
        ratio = current_period_count / baseline_period_avg
        if ratio <= 1.0:
            return 0.1
        # Map ratio >= 1.0 into [0.1, 1.0]
        score = 1.0 - math.exp(-0.6 * (ratio - 1.0))
        return round(float(np.clip(score, 0.0, 1.0)), 4)

    def compute_relationship_novelty(self, prior_transactions_count: int, relationship_age_days: float) -> float:
        """
        Computes relationship freshness/novelty score [0.0, 1.0].
        0 prior transactions + age < 3 days -> 1.0
        established partner -> 0.0
        """
        if prior_transactions_count == 0:
            return 1.0
        if prior_transactions_count <= 2 and relationship_age_days < 5:
            return 0.85
        if prior_transactions_count < 10:
            return 0.45
        return 0.05

    def compute_temporal_clustering(self, timestamps: List[datetime], window_hours: float = 72.0) -> float:
        """
        Measures burstiness or abnormal temporal concentration of events within window_hours.
        Returns [0.0, 1.0].
        """
        if len(timestamps) < 2:
            return 0.0
        sorted_ts = sorted(timestamps)
        total_duration_hours = max((sorted_ts[-1] - sorted_ts[0]).total_seconds() / 3600.0, 0.1)
        
        # If multiple events occur in a tiny window (< 1 hour), score is very high
        if total_duration_hours <= 1.0 and len(timestamps) >= 3:
            return 0.95
        if total_duration_hours <= window_hours and len(timestamps) >= 3:
            # Ratio of events to window duration
            density = len(timestamps) / (total_duration_hours + 1.0)
            score = 1.0 - math.exp(-0.4 * density)
            return round(float(np.clip(score, 0.2, 0.95)), 4)
        return 0.15

    def compute_historical_deviation(self, current_value: float, expected_value: float) -> float:
        """
        Measures percentage discrepancy between expected and actual settlement/revenue.
        """
        if expected_value <= 0:
            return 0.0
        diff = abs(current_value - expected_value)
        pct = diff / expected_value
        score = 1.0 - math.exp(-5.0 * pct)
        return round(float(np.clip(score, 0.0, 1.0)), 4)

    def compute_graph_change(self, node_degree_shift: float, new_edge_ratio: float) -> float:
        """
        Measures topological perturbation in the ego-network.
        """
        score = 0.5 * min(node_degree_shift / 10.0, 1.0) + 0.5 * min(new_edge_ratio, 1.0)
        return round(float(np.clip(score, 0.0, 1.0)), 4)
