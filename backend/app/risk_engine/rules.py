from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json

def safe_float(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def safe_datetime(val: Any) -> datetime:
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val)
        except Exception:
            pass
    return datetime.utcnow()

@dataclass
class RuleResult:
    rule_id: str
    rule_name: str
    description: str
    score_points: int
    category: str
    evidence: str
    triggered: bool

class BaseRule:
    rule_id: str = "BASE_RULE"
    rule_name: str = "Base Rule"
    description: str = ""
    score_points: int = 0
    category: str = "GENERAL"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        raise NotImplementedError

class BaselineAmountRule(BaseRule):
    rule_id = "RULE_AMOUNT_BASELINE"
    rule_name = "Baseline Amount Discrepancy"
    description = "Transaction value substantially exceeds customer's historical baseline"
    score_points = 35
    category = "AMOUNT_ANOMALY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        amount = safe_float(txn_data.get("amount"), 0.0)
        baseline = safe_float(txn_data.get("customer_baseline_amount"), 100.0)
        multiplier = 3.0

        if amount > 0 and baseline > 0 and amount >= (baseline * multiplier):
            ratio = round(amount / baseline, 1)
            evidence = (
                f"Current amount (${amount:,.2f}) is {ratio}x higher than customer's "
                f"baseline average of ${baseline:,.2f}."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Amount conforms to expected customer historical baseline.",
            triggered=False
        )

class VelocitySpikeRule(BaseRule):
    rule_id = "RULE_VELOCITY_SPIKE"
    rule_name = "High Velocity Activity"
    description = "Multiple payment attempts initiated within a tight 10-minute time window"
    score_points = 25
    category = "VELOCITY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        current_time = safe_datetime(txn_data.get("timestamp"))
        window_start = current_time - timedelta(minutes=10)
        customer_id = txn_data.get("customer_id")
        ip = txn_data.get("ip_address")

        recent_attempts = 0
        for h in historical_txns:
            if not isinstance(h, dict):
                continue
            h_time = safe_datetime(h.get("timestamp"))
            if h_time >= window_start and h_time <= current_time:
                if (customer_id and h.get("customer_id") == customer_id) or (ip and h.get("ip_address") == ip):
                    recent_attempts += 1

        if recent_attempts >= 3:
            evidence = (
                f"{recent_attempts} payment attempts detected within 10 minutes for "
                f"customer {customer_id or 'unknown'} / IP {ip or 'unknown'}."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Velocity within standard parameters (< 3 attempts in 10m).",
            triggered=False
        )

class DuplicateReferenceRule(BaseRule):
    rule_id = "RULE_DUPLICATE_ORDER_REF"
    rule_name = "Duplicate Reference / Device Signature"
    description = "Repetitive order reference or identical device fingerprint in quick succession"
    score_points = 30
    category = "INTEGRITY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        ref_id = txn_data.get("reference_id")
        device = txn_data.get("device_fingerprint")
        amount = safe_float(txn_data.get("amount"), 0.0)

        # Check duplicate reference or exact amount + device match
        dup_found = False
        reason = ""
        for h in historical_txns:
            if not isinstance(h, dict):
                continue
            if ref_id and h.get("reference_id") == ref_id and h.get("id") != txn_data.get("id"):
                dup_found = True
                reason = f"Duplicate reference ID '{ref_id}' previously recorded in transaction database."
                break
            if device and h.get("device_fingerprint") == device and safe_float(h.get("amount")) == amount and amount > 0 and h.get("id") != txn_data.get("id"):
                dup_found = True
                reason = f"Identical device fingerprint '{device}' executed identical amount (${amount}) previously."
                break

        if dup_found:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=reason,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Unique transaction reference and device telemetry validated.",
            triggered=False
        )

class OrderItemMismatchRule(BaseRule):
    rule_id = "RULE_ORDER_ITEM_MISMATCH"
    rule_name = "Order Item Calculation Mismatch"
    description = "Discrepancy between stated transaction total and sum of line items"
    score_points = 20
    category = "DATA_INTEGRITY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        amount = safe_float(txn_data.get("amount"), 0.0)
        items_raw = txn_data.get("items") or txn_data.get("items_json")
        items = []

        if isinstance(items_raw, str):
            try:
                parsed = json.loads(items_raw)
                if isinstance(parsed, list):
                    items = parsed
            except Exception:
                items = []
        elif isinstance(items_raw, list):
            items = items_raw

        if items and len(items) > 0 and amount > 0:
            calc_total = 0.0
            for it in items:
                if isinstance(it, dict):
                    price = safe_float(it.get("price"), 0.0)
                    try:
                        qty = int(it.get("quantity", 1) or 1)
                    except (ValueError, TypeError):
                        qty = 1
                else:
                    price = safe_float(getattr(it, "price", 0.0), 0.0)
                    try:
                        qty = int(getattr(it, "quantity", 1) or 1)
                    except (ValueError, TypeError):
                        qty = 1
                calc_total += price * qty

            diff = abs(amount - calc_total)
            if diff > 0.05:
                evidence = (
                    f"Cart calculation discrepancy: Line items sum to ${calc_total:,.2f}, "
                    f"but checkout total is charged as ${amount:,.2f} (variance: ${diff:,.2f})."
                )
                return RuleResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    description=self.description,
                    score_points=self.score_points,
                    category=self.category,
                    evidence=evidence,
                    triggered=True
                )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Line items total correlates with overall transaction amount.",
            triggered=False
        )

class GeoIPAnomalyRule(BaseRule):
    rule_id = "RULE_GEO_IP_ANOMALY"
    rule_name = "Geolocation / Country Inconsistency"
    description = "IP connection country differs significantly from billing/shipping country"
    score_points = 22
    category = "GEOLOCATION"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        ip_country = str(txn_data.get("ip_country") or "").upper().strip()
        billing_country = str(txn_data.get("billing_country") or "").upper().strip()

        if ip_country and billing_country and ip_country not in ("UNKNOWN", "") and billing_country not in ("UNKNOWN", "") and ip_country != billing_country:
            evidence = (
                f"Client connection originated from {ip_country}, but billing "
                f"instrument registered in {billing_country}."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Origin IP country aligns with billing profile.",
            triggered=False
        )

class BurstFrequencyRule(BaseRule):
    rule_id = "RULE_HIGH_FREQUENCY_BURST"
    rule_name = "Rapid Automated Burst"
    description = "High rate of transactions submitted in under 60 seconds"
    score_points = 18
    category = "AUTOMATION"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        current_time = safe_datetime(txn_data.get("timestamp"))
        window_start = current_time - timedelta(seconds=60)
        device = txn_data.get("device_fingerprint")
        ip = txn_data.get("ip_address")

        burst_count = 0
        for h in historical_txns:
            if not isinstance(h, dict):
                continue
            h_time = safe_datetime(h.get("timestamp"))
            if h_time >= window_start and h_time <= current_time:
                if (device and h.get("device_fingerprint") == device) or (ip and h.get("ip_address") == ip):
                    burst_count += 1

        if burst_count >= 4:
            evidence = f"Detected {burst_count} rapid transactions in under 60 seconds from IP/Device."
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Submission rate conforms to standard human browsing behavior.",
            triggered=False
        )

class AccountAgeAnomalyRule(BaseRule):
    rule_id = "RULE_ACCOUNT_AGE_ANOMALY"
    rule_name = "New Account Velocity / Value Anomaly"
    description = "Substantial transaction initiated on customer account created under 7 days ago"
    score_points = 24
    category = "ACCOUNT_MATURITY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        account_age = safe_float(txn_data.get("account_age_days"), 90.0)
        amount = safe_float(txn_data.get("amount"), 0.0)
        baseline = safe_float(txn_data.get("customer_baseline_amount"), 100.0)

        if account_age < 7.0 and (amount >= 200.0 or amount >= (baseline * 2.0)):
            evidence = (
                f"Customer account is newly registered ({int(account_age)} day(s) old) "
                f"initiating an elevated ${amount:,.2f} order."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Account maturity aligns with transaction scope.",
            triggered=False
        )

class FailedAttemptsSpikeRule(BaseRule):
    rule_id = "RULE_FAILED_ATTEMPTS_SPIKE"
    rule_name = "Prior Failed / Declined Transactions"
    description = "Multiple card declines or failed authorization attempts recorded within 24 hours"
    score_points = 28
    category = "AUTHENTICATION_INTEGRITY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        failed_count = safe_float(txn_data.get("failed_attempts_24h"), 0.0)
        if failed_count >= 2:
            evidence = (
                f"{int(failed_count)} failed or declined payment attempts recorded in the past 24 hours "
                f"(potential card-testing or credential stuffing)."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="No prior payment decline sequences recorded.",
            triggered=False
        )

class SubThresholdStructuringRule(BaseRule):
    rule_id = "RULE_SUBTHRESHOLD_STRUCTURING"
    rule_name = "Smurfing / Structuring Evasion Pattern"
    description = "Order amount specifically structured just below heuristic review thresholds"
    score_points = 22
    category = "EVASION_DEFENSE"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        amount = safe_float(txn_data.get("amount"), 0.0)
        baseline = safe_float(txn_data.get("customer_baseline_amount"), 100.0)
        ratio = (amount / baseline) if baseline > 0 else 1.0

        # Evasion pattern: attacker knows threshold is 3.0x or $100 and prices at $95-$99.99 or 2.7x-2.99x
        is_subthreshold_amount = (90.0 <= amount <= 99.99) or (950.0 <= amount <= 999.99)
        is_subthreshold_ratio = (2.7 <= ratio < 3.0)

        if is_subthreshold_amount or is_subthreshold_ratio:
            evidence = (
                f"Structuring pattern detected: Order value of ${amount:,.2f} ({ratio:.2f}x baseline) "
                f"hovers immediately below common automated screening thresholds."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Transaction value conforms to non-structured pricing.",
            triggered=False
        )

class DeviceSessionIntegrityRule(BaseRule):
    rule_id = "RULE_DEVICE_INTEGRITY"
    rule_name = "Device Telemetry & Proxy Risk"
    description = "Headless browser automation signature, Tor exit relay, or anonymous proxy detected"
    score_points = 26
    category = "DEVICE_INTEGRITY"

    def evaluate(self, txn_data: Dict[str, Any], historical_txns: List[Dict[str, Any]]) -> RuleResult:
        device = str(txn_data.get("device_fingerprint") or "").lower()
        ip_country = str(txn_data.get("ip_country") or "").upper()
        
        is_suspicious_device = (
            "headless" in device or
            "tor" in device or
            "ghost" in device or
            "puppet" in device or
            "selenium" in device
        )

        if is_suspicious_device:
            evidence = (
                f"Device telemetry flagged: Signature '{device}' matches automated headless "
                f"browser or anonymized proxy network."
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                description=self.description,
                score_points=self.score_points,
                category=self.category,
                evidence=evidence,
                triggered=True
            )
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            description=self.description,
            score_points=0,
            category=self.category,
            evidence="Browser and device environment validated as legitimate user agent.",
            triggered=False
        )
