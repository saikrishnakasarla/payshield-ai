import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.transaction import Transaction

client = TestClient(app)

def test_health_check_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "paypal_mode" in data

def test_dashboard_summary_endpoint():
    res = client.get("/api/dashboard/summary?timeframe=24h")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "risk_volume" in data["metrics"]
    assert "timeline" in data
    assert len(data["timeline"]) > 0

def test_transactions_listing_and_filtering():
    res = client.get("/api/transactions?page=1&limit=5&risk_level=ALL")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5

def test_transaction_detail_and_review():
    # Fetch first transaction from DB
    res = client.get("/api/transactions?page=1&limit=1")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) > 0
    txn_id = items[0]["id"]

    # Get details
    detail_res = client.get(f"/api/transactions/{txn_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "transaction" in detail
    assert "latest_analysis" in detail

    # Perform review
    review_res = client.post(
        f"/api/transactions/{txn_id}/review",
        json={
            "review_status": "REVIEWED_SAFE",
            "notes": "Verified by merchant compliance test suite.",
            "reviewer": "Automated Test Runner"
        }
    )
    assert review_res.status_code == 200
    assert review_res.json()["review_status"] == "REVIEWED_SAFE"

def test_insights_endpoint():
    res = client.get("/api/insights")
    assert res.status_code == 200
    data = res.json()
    assert "total_volume" in data
    assert "chargeback_readiness_score" in data
    assert "ai_executive_summary" in data

def test_csv_export_endpoint():
    res = client.get("/api/insights/export-csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers.get("content-type", "")
    assert "attachment" in res.headers.get("content-disposition", "")
    content = res.text
    assert "Reference ID" in content
    assert "Risk Score (0-100)" in content
    assert "Review Status" in content

def test_transaction_review_invalid_status_rejected():
    res = client.get("/api/transactions?page=1&limit=1")
    txn_id = res.json()["items"][0]["id"]
    review_res = client.post(
        f"/api/transactions/{txn_id}/review",
        json={"review_status": "INVALID_STATUS_CODE", "notes": "Hacking attempt"}
    )
    assert review_res.status_code == 400
    assert "Invalid review status" in review_res.json()["detail"]

def test_transactions_pagination_limit_exceeded_rejected():
    res = client.get("/api/transactions?limit=105")
    assert res.status_code == 422

def test_transaction_reanalyze_endpoint():
    res = client.get("/api/transactions?page=1&limit=1")
    txn_id = res.json()["items"][0]["id"]
    analyze_res = client.post(f"/api/transactions/{txn_id}/analyze")
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert "deterministic_score" in data
    assert "ai_analysis" in data
    assert 0 <= data["deterministic_score"] <= 100
