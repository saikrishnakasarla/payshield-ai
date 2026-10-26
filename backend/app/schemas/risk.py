from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TriggeredRuleSchema(BaseModel):
    rule_id: str
    rule_name: str
    description: str
    score_points: int
    category: str
    evidence: str

class RiskAnalysisResponse(BaseModel):
    id: Optional[int] = None
    transaction_id: int
    deterministic_score: int = Field(..., ge=0, le=100)
    risk_level: str # LOW, MEDIUM, HIGH
    triggered_rules: List[TriggeredRuleSchema]
    
    # ML Classification Details
    ml_fraud_probability: Optional[float] = 0.0
    ml_risk_tier: Optional[str] = "LOW"
    hybrid_score: Optional[int] = 0
    feature_attributions: Optional[List[Dict[str, Any]]] = []
    
    ai_summary: str
    ai_explanation: str
    ai_uncertainties: str
    ai_recommended_steps: List[str]
    model_used: str
    created_at: datetime
    
    disclaimer: str = (
        "Demonstration Notice: Risk scores are approximations generated "
        "by machine learning inference and deterministic rules for merchant review. They do NOT "
        "constitute definitive legal accusations of fraud."
    )

class ReviewActionRequest(BaseModel):
    review_status: str = Field(..., description="REVIEWED_SAFE or ESCALATED_HUMAN_REVIEW or UNREVIEWED")
    notes: Optional[str] = None
    reviewer: Optional[str] = "Merchant Reviewer"
