from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class RiskAnalysis(Base):
    __tablename__ = "risk_analyses"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    
    # Deterministic Heuristic Risk Score (0-100)
    deterministic_score = Column(Integer, nullable=False)
    risk_level = Column(String(16), nullable=False) # LOW, MEDIUM, HIGH
    triggered_rules_json = Column(Text, default="[]") # JSON list of rule objects

    # Machine Learning Fraud Classification Outputs
    ml_fraud_probability = Column(Float, default=0.0) # Calibrated P(fraud) in [0.0, 1.0]
    ml_risk_tier = Column(String(16), default="LOW")  # LOW, MEDIUM, HIGH
    hybrid_score = Column(Integer, default=0)         # Blended score: 60% ML + 40% Rules
    feature_attributions_json = Column(Text, default="[]") # SHAP-like feature contributions
    
    # Explainable AI Grounded Narrative
    ai_summary = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    ai_uncertainties = Column(Text, nullable=True)
    ai_recommended_steps = Column(Text, nullable=True)
    model_used = Column(String(64), default="RandomForest-v1.0+Gemini")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="analyses")
