from typing import List, Dict, Any, Tuple
from app.risk_engine.rules import (
    BaseRule,
    BaselineAmountRule,
    VelocitySpikeRule,
    DuplicateReferenceRule,
    OrderItemMismatchRule,
    GeoIPAnomalyRule,
    BurstFrequencyRule,
    AccountAgeAnomalyRule,
    FailedAttemptsSpikeRule,
    SubThresholdStructuringRule,
    DeviceSessionIntegrityRule,
    RuleResult
)
from app.risk_engine.ml_model import fraud_ml_model
from app.config import settings

class RiskEngine:
    def __init__(self, custom_rules: List[BaseRule] = None):
        self.rules: List[BaseRule] = custom_rules or [
            BaselineAmountRule(),
            VelocitySpikeRule(),
            DuplicateReferenceRule(),
            OrderItemMismatchRule(),
            GeoIPAnomalyRule(),
            BurstFrequencyRule(),
            AccountAgeAnomalyRule(),
            FailedAttemptsSpikeRule(),
            SubThresholdStructuringRule(),
            DeviceSessionIntegrityRule(),
        ]
        self.ml_model = fraud_ml_model

    def evaluate_transaction(
        self,
        txn_data: Dict[str, Any],
        historical_txns: List[Dict[str, Any]] = None
    ) -> Tuple[int, str, List[RuleResult]]:
        """
        Evaluates a transaction deterministically against all configured rules.
        Maintains backwards compatibility returning (score, risk_level, triggered_rules).
        """
        score, risk_level, triggered_rules, _ = self.evaluate_transaction_full(txn_data, historical_txns)
        return score, risk_level, triggered_rules

    def evaluate_transaction_full(
        self,
        txn_data: Dict[str, Any],
        historical_txns: List[Dict[str, Any]] = None
    ) -> Tuple[int, str, List[RuleResult], Dict[str, Any]]:
        """
        Full multi-paradigm evaluation:
        1. Deterministic Heuristic Rules Engine (bounded 0-100)
        2. Trained Random Forest ML Classifier (fraud probability [0.0 - 1.0] + SHAP-like attributions)
        3. Calibrated Hybrid Ensemble Score (60% ML + 40% Rules)
        
        Returns:
            (deterministic_score, risk_level, triggered_rules, ml_result)
        """
        historical = historical_txns or []
        total_score = 0
        triggered_rules: List[RuleResult] = []

        for rule in self.rules:
            res = rule.evaluate(txn_data, historical)
            if res.triggered:
                total_score += res.score_points
                triggered_rules.append(res)

        # Enforce strict bounds between 0 and 100 for rule score
        bounded_score = max(0, min(100, total_score))

        # Evaluate ML model
        ml_prediction = self.ml_model.predict_fraud_probability(txn_data, historical)
        prob = ml_prediction["fraud_probability"]

        # Calculate Hybrid Ensemble Score
        # 60% weight on calibrated ML probability, 40% weight on rule heuristics
        hybrid_score = int(round((prob * 100 * 0.60) + (bounded_score * 0.40)))
        hybrid_score = max(0, min(100, hybrid_score))

        ml_prediction["hybrid_score"] = hybrid_score
        ml_prediction["rule_score"] = bounded_score

        # Determine consolidated risk level
        # If either ML probability is high (> 0.70) or rule score is high (>= 70), risk is HIGH
        if bounded_score >= settings.HIGH_RISK_SCORE or prob >= 0.70:
            risk_level = "HIGH"
        elif bounded_score >= settings.MEDIUM_RISK_SCORE or prob >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        ml_prediction["consolidated_risk_level"] = risk_level

        return bounded_score, risk_level, triggered_rules, ml_prediction

risk_engine = RiskEngine()
