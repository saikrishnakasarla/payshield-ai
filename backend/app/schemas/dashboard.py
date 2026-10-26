from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class MetricCard(BaseModel):
    title: str
    value: str
    numeric_value: float
    change_pct: str
    change_direction: str # up, down, neutral
    badge_label: str
    badge_color: str # emerald, amber, rose, cyan, purple

class RiskTimelinePoint(BaseModel):
    timestamp_label: str
    low_risk: int
    medium_risk: int
    high_risk: int
    total_volume: float

class RiskPatternStat(BaseModel):
    pattern_name: str
    volume_formatted: str
    raw_amount: float
    percentage: float
    color_hex: str

class GeoRiskStat(BaseModel):
    country: str
    country_code: str
    attempts: int
    flag_rate: int # e.g. 94%

class ModelHealthStat(BaseModel):
    metric: str
    value: str
    description: str

class DashboardSummaryResponse(BaseModel):
    timeframe: str
    is_demo: bool = True
    metrics: Dict[str, MetricCard]
    timeline: List[RiskTimelinePoint]
    risk_by_pattern: List[RiskPatternStat]
    high_risk_origins: List[GeoRiskStat]
    model_health: List[ModelHealthStat]
    recent_flagged: List[Dict[str, Any]]
    total_transactions: int
    flagged_count: int
    review_queue_count: int

class InsightsResponse(BaseModel):
    total_volume: float
    avg_transaction_amount: float
    risk_distribution: Dict[str, int]
    top_triggered_rules: List[Dict[str, Any]]
    chargeback_readiness_score: int
    ai_executive_summary: str
    insights_generated_at: str
    calculation_methodology: Optional[str] = None
    model_metrics: Optional[Dict[str, Any]] = None
