from datetime import datetime, timedelta
import json
import random
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.risk_analysis import RiskAnalysis
from app.models.audit_log import AuditLog, record_audit_event
from app.risk_engine.engine import risk_engine
from app.services.ai_explainer import ai_explainer

# 33 deterministic, reproducible scenarios with 4 showcase scenarios
SEED_SCENARIOS = [
    # Showcase 1: Legitimate Normal Transaction
    {
        "reference_id": "TXN-847201",
        "offset_minutes": 15,
        "amount": 42.50,
        "customer_id": "CUST-1001",
        "customer_name": "Emma Watson",
        "customer_email": "emma.w@example.com",
        "customer_baseline_amount": 50.0,
        "customer_baseline_orders": 8,
        "account_age_days": 210,
        "failed_attempts_24h": 0,
        "ip_address": "73.189.42.11",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-safari-101",
        "items": [{"name": "Organic Coffee Beans 1lb", "price": 21.25, "quantity": 2}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": "Routine subscription order conforming to established 7-month customer baseline."
    },

    # Showcase 2: Suspicious Compound High-Value Attack
    {
        "reference_id": "TXN-847291",
        "offset_minutes": 6,
        "amount": 2847.00,
        "customer_id": "CUST-9999",
        "customer_name": "Alex Smith",
        "customer_email": "alex.smith.test@example.com",
        "customer_baseline_amount": 80.0,
        "customer_baseline_orders": 2,
        "account_age_days": 3,
        "failed_attempts_24h": 4,
        "ip_address": "194.165.16.2",
        "ip_country": "RU",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-ghost-headless-999",
        "items": [{"name": "Bulk Gift Cards ($500 x 5)", "price": 500.00, "quantity": 5}, {"name": "Processing Fee", "price": 347.00, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "Escalated: 35x baseline order volume, foreign IP geolocation mismatch (RU/US), headless browser signature, and repeated decline history."
    },

    # Showcase 3: Ambiguous Payment (Legitimate Customer on Overseas Travel)
    {
        "reference_id": "TXN-847285",
        "offset_minutes": 330,
        "amount": 499.00,
        "customer_id": "CUST-1008",
        "customer_name": "Lucas Silva",
        "customer_email": "lucas.s@example.com",
        "customer_baseline_amount": 250.0,
        "customer_baseline_orders": 4,
        "account_age_days": 120,
        "failed_attempts_24h": 0,
        "ip_address": "177.18.90.22",
        "ip_country": "BR",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-android-samsung-808",
        "items": [{"name": "Smart Security Hub", "price": 499.00, "quantity": 1}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },

    # Showcase 4: Adversarial Evasion Test (Sub-threshold Structuring / Smurfing Evasion)
    {
        "reference_id": "TXN-847299",
        "offset_minutes": 8,
        "amount": 98.50,
        "customer_id": "CUST-ADVERSARIAL",
        "customer_name": "Victor Evasion",
        "customer_email": "v.evasion@stealth-mail.org",
        "customer_baseline_amount": 35.0, # 2.81x ratio: specifically designed to stay beneath naive 3.0x rule
        "customer_baseline_orders": 1,
        "account_age_days": 1,            # 1 day old
        "failed_attempts_24h": 3,         # Multiple declines
        "ip_address": "185.220.101.44",   # Tor exit relay
        "ip_country": "US",
        "billing_country": "US",
        "device_fingerprint": "fp-headless-puppeteer-bot",
        "items": [{"name": "Prepaid Digital Voucher", "price": 98.50, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "Adversarial Test: Attacker attempted sub-threshold structuring ($98.50) to evade 3.0x baseline rule. Caught by PayShield Random Forest ML + Smurfing Rule."
    },
    {
        "reference_id": "TXN-847202",
        "offset_minutes": 45,
        "amount": 78.00,
        "customer_id": "CUST-1002",
        "customer_name": "Liam Davies",
        "customer_email": "liam.d@example.co.uk",
        "customer_baseline_amount": 75.0,
        "customer_baseline_orders": 12,
        "ip_address": "81.2.69.142",
        "ip_country": "GB",
        "billing_country": "GB",
        "shipping_country": "GB",
        "device_fingerprint": "fp-win-chrome-202",
        "items": [{"name": "Thermal Ceramic Mug", "price": 26.00, "quantity": 3}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": "Established regular UK customer."
    },
    {
        "reference_id": "TXN-847203",
        "offset_minutes": 75,
        "amount": 115.00,
        "customer_id": "CUST-1003",
        "customer_name": "Sophia Chen",
        "customer_email": "sophia.chen@example.ca",
        "customer_baseline_amount": 110.0,
        "customer_baseline_orders": 6,
        "ip_address": "24.114.32.9",
        "ip_country": "CA",
        "billing_country": "CA",
        "shipping_country": "CA",
        "device_fingerprint": "fp-ios-safari-303",
        "items": [{"name": "Wireless Charging Pad", "price": 57.50, "quantity": 2}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847204",
        "offset_minutes": 110,
        "amount": 34.99,
        "customer_id": "CUST-1004",
        "customer_name": "Noah Miller",
        "customer_email": "noah.m@example.com",
        "customer_baseline_amount": 40.0,
        "customer_baseline_orders": 4,
        "ip_address": "172.56.21.80",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-android-chrome-404",
        "items": [{"name": "Desk Cable Organizers", "price": 34.99, "quantity": 1}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847205",
        "offset_minutes": 150,
        "amount": 92.00,
        "customer_id": "CUST-1005",
        "customer_name": "Olivia Taylor",
        "customer_email": "olivia.t@example.com",
        "customer_baseline_amount": 85.0,
        "customer_baseline_orders": 15,
        "ip_address": "98.210.14.77",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-firefox-505",
        "items": [{"name": "Bluetooth Noise Earbuds", "price": 92.00, "quantity": 1}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },

    # High Baseline Discrepancy (triggers RULE_AMOUNT_BASELINE)
    {
        "reference_id": "TXN-847288",
        "offset_minutes": 210,
        "amount": 1299.00,
        "customer_id": "CUST-1006",
        "customer_name": "Marcus Vance",
        "customer_email": "marcus.v@example.com",
        "customer_baseline_amount": 65.0,
        "customer_baseline_orders": 3,
        "ip_address": "66.249.80.12",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-edge-606",
        "items": [{"name": "Enterprise Monitor 34-inch", "price": 1299.00, "quantity": 1}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847289",
        "offset_minutes": 280,
        "amount": 2100.00,
        "customer_id": "CUST-1007",
        "customer_name": "Elena Rostova",
        "customer_email": "elena.r@example.com",
        "customer_baseline_amount": 120.0,
        "customer_baseline_orders": 2,
        "ip_address": "194.226.57.10",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-linux-chrome-707",
        "items": [{"name": "High-End Workstation Laptop", "price": 2100.00, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "Unusual volume relative to baseline ($120). Waiting for phone confirmation."
    },

    # Geolocation Mismatch (triggers RULE_GEO_IP_ANOMALY)
    {
        "reference_id": "TXN-847286",
        "offset_minutes": 390,
        "amount": 750.00,
        "customer_id": "CUST-1009",
        "customer_name": "Tariq Adeleke",
        "customer_email": "tariq.a@example.com",
        "customer_baseline_amount": 400.0,
        "customer_baseline_orders": 5,
        "ip_address": "105.112.43.19",
        "ip_country": "NG",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-chrome-909",
        "items": [{"name": "Digital CAD Suite Pro", "price": 750.00, "quantity": 1}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },

    # Item Calculation Mismatch (triggers RULE_ORDER_ITEM_MISMATCH)
    {
        "reference_id": "TXN-847287",
        "offset_minutes": 440,
        "amount": 340.00, # Actual sum is 120.00
        "customer_id": "CUST-1010",
        "customer_name": "Chloe Bennett",
        "customer_email": "chloe.b@example.com",
        "customer_baseline_amount": 150.0,
        "customer_baseline_orders": 3,
        "ip_address": "198.51.100.45",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-safari-1010",
        "items": [{"name": "Ergonomic Keypad", "price": 60.00, "quantity": 2}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },

    # Cluster of rapid velocity transactions from CUST-9999 / same IP
    {
        "reference_id": "TXN-847292",
        "offset_minutes": 4,
        "amount": 2847.00,
        "customer_id": "CUST-9999",
        "customer_name": "Alex Smith",
        "customer_email": "alex.smith.test@example.com",
        "customer_baseline_amount": 80.0,
        "customer_baseline_orders": 2,
        "ip_address": "194.165.16.2",
        "ip_country": "RU",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-ghost-headless-999",
        "items": [{"name": "Bulk Gift Cards ($500 x 5)", "price": 500.00, "quantity": 5}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847293",
        "offset_minutes": 2,
        "amount": 2847.00,
        "customer_id": "CUST-9999",
        "customer_name": "Alex Smith",
        "customer_email": "alex.smith.test@example.com",
        "customer_baseline_amount": 80.0,
        "customer_baseline_orders": 2,
        "ip_address": "194.165.16.2",
        "ip_country": "RU",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-ghost-headless-999",
        "items": [{"name": "Bulk Gift Cards ($500 x 5)", "price": 500.00, "quantity": 5}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },

    # 19 more diverse historical transactions spanning 1 to 28 days ago
    {
        "reference_id": "TXN-847150",
        "offset_minutes": 60 * 24 * 1, # 1 day ago
        "amount": 85.00,
        "customer_id": "CUST-1011",
        "customer_name": "David Kim",
        "customer_email": "david.k@example.com",
        "customer_baseline_amount": 90.0,
        "customer_baseline_orders": 9,
        "ip_address": "12.180.33.2",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-safari-1011",
        "items": [{"name": "USB-C Dual Dock", "price": 85.00, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": "Verified buyer."
    },
    {
        "reference_id": "TXN-847151",
        "offset_minutes": 60 * 24 * 2, # 2 days ago
        "amount": 1640.00,
        "customer_id": "CUST-1012",
        "customer_name": "Rachel Adams",
        "customer_email": "rachel.a@example.com",
        "customer_baseline_amount": 110.0,
        "customer_baseline_orders": 2,
        "ip_address": "185.220.101.5",
        "ip_country": "DE",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-tor-exit-12",
        "items": [{"name": "Pro Audio Mixer Console", "price": 1640.00, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "Foreign IP and 15x baseline spike."
    },
    {
        "reference_id": "TXN-847152",
        "offset_minutes": 60 * 24 * 3,
        "amount": 62.00,
        "customer_id": "CUST-1013",
        "customer_name": "James Wilson",
        "customer_email": "james.w@example.com",
        "customer_baseline_amount": 60.0,
        "customer_baseline_orders": 7,
        "ip_address": "67.140.22.91",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-chrome-13",
        "items": [{"name": "Ergonomic Mouse", "price": 62.00, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847153",
        "offset_minutes": 60 * 24 * 4,
        "amount": 540.00,
        "customer_id": "CUST-1014",
        "customer_name": "Amina Al-Mansoor",
        "customer_email": "amina.m@example.com",
        "customer_baseline_amount": 120.0,
        "customer_baseline_orders": 1,
        "ip_address": "82.102.25.14",
        "ip_country": "AE",
        "billing_country": "AE",
        "shipping_country": "AE",
        "device_fingerprint": "fp-ios-safari-14",
        "items": [{"name": "Smart Video Doorbell Kit", "price": 270.00, "quantity": 2}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": "International verified order."
    },
    {
        "reference_id": "TXN-847154",
        "offset_minutes": 60 * 24 * 5,
        "amount": 310.00,
        "customer_id": "CUST-1015",
        "customer_name": "Carlos Gomez",
        "customer_email": "carlos.g@example.com",
        "customer_baseline_amount": 95.0,
        "customer_baseline_orders": 4,
        "ip_address": "186.28.140.67",
        "ip_country": "CO",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-firefox-15",
        "items": [{"name": "Studio Microphone Pack", "price": 310.00, "quantity": 1}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847155",
        "offset_minutes": 60 * 24 * 6,
        "amount": 49.99,
        "customer_id": "CUST-1016",
        "customer_name": "Maya Patel",
        "customer_email": "maya.p@example.com",
        "customer_baseline_amount": 50.0,
        "customer_baseline_orders": 14,
        "ip_address": "76.103.88.19",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-chrome-16",
        "items": [{"name": "LED Desk Lamp", "price": 49.99, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847156",
        "offset_minutes": 60 * 24 * 7,
        "amount": 1850.00,
        "customer_id": "CUST-1017",
        "customer_name": "Viktor Hansen",
        "customer_email": "viktor.h@example.dk",
        "customer_baseline_amount": 100.0,
        "customer_baseline_orders": 2,
        "ip_address": "85.204.112.9",
        "ip_country": "DK",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-linux-edge-17",
        "items": [{"name": "3D Printer Core Unit", "price": 1850.00, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "18x baseline jump, flagged."
    },
    {
        "reference_id": "TXN-847157",
        "offset_minutes": 60 * 24 * 8,
        "amount": 72.50,
        "customer_id": "CUST-1018",
        "customer_name": "Grace Hopper",
        "customer_email": "grace.h@example.com",
        "customer_baseline_amount": 70.0,
        "customer_baseline_orders": 20,
        "ip_address": "128.30.52.1",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-bsd-firefox-18",
        "items": [{"name": "Mechanical Switch Keycaps", "price": 72.50, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": "Known loyal customer."
    },
    {
        "reference_id": "TXN-847158",
        "offset_minutes": 60 * 24 * 10,
        "amount": 135.00,
        "customer_id": "CUST-1019",
        "customer_name": "Samuel Jackson",
        "customer_email": "sam.j@example.com",
        "customer_baseline_amount": 140.0,
        "customer_baseline_orders": 5,
        "ip_address": "69.147.76.15",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-ios-chrome-19",
        "items": [{"name": "Smart Thermostat V2", "price": 135.00, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847159",
        "offset_minutes": 60 * 24 * 12,
        "amount": 950.00,
        "customer_id": "CUST-1020",
        "customer_name": "Igor Petrov",
        "customer_email": "igor.p@example.ru",
        "customer_baseline_amount": 80.0,
        "customer_baseline_orders": 1,
        "ip_address": "95.173.136.2",
        "ip_country": "RU",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-opera-20",
        "items": [{"name": "Digital License Keys (x10)", "price": 95.00, "quantity": 10}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "Geo mismatch RU/US + 11x baseline."
    },
    {
        "reference_id": "TXN-847160",
        "offset_minutes": 60 * 24 * 14,
        "amount": 28.50,
        "customer_id": "CUST-1021",
        "customer_name": "Hannah Abbott",
        "customer_email": "hannah.a@example.com",
        "customer_baseline_amount": 30.0,
        "customer_baseline_orders": 6,
        "ip_address": "24.60.11.89",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-android-chrome-21",
        "items": [{"name": "Screen Cleaning Kit", "price": 28.50, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847161",
        "offset_minutes": 60 * 24 * 16,
        "amount": 890.00,
        "customer_id": "CUST-1022",
        "customer_name": "Rajesh Kumar",
        "customer_email": "rajesh.k@example.in",
        "customer_baseline_amount": 900.0,
        "customer_baseline_orders": 8,
        "ip_address": "103.21.244.0",
        "ip_country": "IN",
        "billing_country": "IN",
        "shipping_country": "IN",
        "device_fingerprint": "fp-mac-safari-22",
        "items": [{"name": "Graphics Tablet Pro", "price": 890.00, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": "Legitimate enterprise client."
    },
    {
        "reference_id": "TXN-847162",
        "offset_minutes": 60 * 24 * 18,
        "amount": 250.00, # mismatch with items 120
        "customer_id": "CUST-1023",
        "customer_name": "Zoe Saldana",
        "customer_email": "zoe.s@example.com",
        "customer_baseline_amount": 200.0,
        "customer_baseline_orders": 3,
        "ip_address": "74.125.19.10",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-ios-safari-23",
        "items": [{"name": "Smart Scale", "price": 60.00, "quantity": 2}],
        "review_status": "UNREVIEWED",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847163",
        "offset_minutes": 60 * 24 * 20,
        "amount": 65.00,
        "customer_id": "CUST-1024",
        "customer_name": "Peter Parker",
        "customer_email": "peter.p@example.com",
        "customer_baseline_amount": 60.0,
        "customer_baseline_orders": 11,
        "ip_address": "64.233.160.1",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-chrome-24",
        "items": [{"name": "Camera Lens Cap Kit", "price": 65.00, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847164",
        "offset_minutes": 60 * 24 * 22,
        "amount": 2200.00,
        "customer_id": "CUST-1025",
        "customer_name": "Klaus Becker",
        "customer_email": "klaus.b@example.de",
        "customer_baseline_amount": 150.0,
        "customer_baseline_orders": 1,
        "ip_address": "195.201.20.10",
        "ip_country": "DE",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-linux-tor-25",
        "items": [{"name": "High-Density Storage Server", "price": 2200.00, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "Suspicious high-value hardware."
    },
    {
        "reference_id": "TXN-847165",
        "offset_minutes": 60 * 24 * 24,
        "amount": 45.00,
        "customer_id": "CUST-1026",
        "customer_name": "Tony Stark",
        "customer_email": "tony.s@example.com",
        "customer_baseline_amount": 250.0,
        "customer_baseline_orders": 18,
        "ip_address": "173.194.222.10",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-safari-26",
        "items": [{"name": "Soldering Iron Tips", "price": 45.00, "quantity": 1}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847166",
        "offset_minutes": 60 * 24 * 26,
        "amount": 110.00,
        "customer_id": "CUST-1027",
        "customer_name": "Bruce Wayne",
        "customer_email": "bruce.w@example.com",
        "customer_baseline_amount": 100.0,
        "customer_baseline_orders": 25,
        "ip_address": "216.58.214.14",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-edge-27",
        "items": [{"name": "Carbon Fiber Bumper Case", "price": 55.00, "quantity": 2}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    },
    {
        "reference_id": "TXN-847167",
        "offset_minutes": 60 * 24 * 28,
        "amount": 1450.00,
        "customer_id": "CUST-1028",
        "customer_name": "Natasha Romanoff",
        "customer_email": "natasha.r@example.com",
        "customer_baseline_amount": 90.0,
        "customer_baseline_orders": 2,
        "ip_address": "178.62.204.1",
        "ip_country": "RU",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-mac-brave-28",
        "items": [{"name": "Thermal Drone Quadcopter", "price": 1450.00, "quantity": 1}],
        "review_status": "ESCALATED_HUMAN_REVIEW",
        "review_notes": "High dollar + RU IP."
    },
    {
        "reference_id": "TXN-847168",
        "offset_minutes": 60 * 24 * 29,
        "amount": 58.00,
        "customer_id": "CUST-1029",
        "customer_name": "Steve Rogers",
        "customer_email": "steve.r@example.com",
        "customer_baseline_amount": 60.0,
        "customer_baseline_orders": 30,
        "ip_address": "72.14.192.0",
        "ip_country": "US",
        "billing_country": "US",
        "shipping_country": "US",
        "device_fingerprint": "fp-win-chrome-29",
        "items": [{"name": "Vintage Leather Notebook", "price": 29.00, "quantity": 2}],
        "review_status": "REVIEWED_SAFE",
        "review_notes": None
    }
]

def seed_database(db: Session, force: bool = False):
    """
    Seeds database with reproducible synthetic demo transactions and deterministic risk scores.
    """
    existing_count = db.query(Transaction).count()
    if existing_count > 0 and not force:
        return {"status": "skipped", "message": f"Database already populated ({existing_count} records)."}

    if force:
        db.query(AuditLog).delete()
        db.query(RiskAnalysis).delete()
        db.query(Transaction).delete()
        db.commit()

    now = datetime.utcnow()
    created_txns = []
    
    # In-memory history for velocity checks during seeding
    historical_for_evaluation = []

    for sc in SEED_SCENARIOS:
        txn_time = now - timedelta(minutes=sc["offset_minutes"])
        items_json = json.dumps(sc["items"])
        
        # Prepare evaluation dict
        txn_dict = {
            "reference_id": sc["reference_id"],
            "timestamp": txn_time,
            "amount": sc["amount"],
            "currency": sc.get("currency", "USD"),
            "customer_id": sc["customer_id"],
            "customer_baseline_amount": sc.get("customer_baseline_amount", 100.0),
            "account_age_days": sc.get("account_age_days", 90),
            "failed_attempts_24h": sc.get("failed_attempts_24h", 0),
            "ip_address": sc.get("ip_address", "127.0.0.1"),
            "ip_country": sc.get("ip_country", "US"),
            "billing_country": sc.get("billing_country", "US"),
            "shipping_country": sc.get("shipping_country", sc.get("billing_country", "US")),
            "device_fingerprint": sc.get("device_fingerprint", "fp-standard-desktop"),
            "items_json": items_json,
        }

        # Evaluate full engine (Deterministic Heuristics + Trained Random Forest ML)
        score, risk_level, triggered_rules, ml_prediction = risk_engine.evaluate_transaction_full(
            txn_dict,
            historical_for_evaluation
        )

        # Append to historical list for upcoming checks
        historical_for_evaluation.append(txn_dict)

        # Generate grounded explainable narrative
        explanation_data = ai_explainer.generate_explanation_sync(
            txn_dict,
            score,
            risk_level,
            triggered_rules,
            ml_prediction
        )

        txn = Transaction(
            reference_id=sc["reference_id"],
            timestamp=txn_time,
            amount=sc["amount"],
            currency=sc.get("currency", "USD"),
            payment_status=sc.get("payment_status", "COMPLETED"),
            customer_id=sc["customer_id"],
            customer_name=sc["customer_name"],
            customer_email=sc["customer_email"],
            customer_baseline_amount=sc.get("customer_baseline_amount", 100.0),
            customer_baseline_orders=sc.get("customer_baseline_orders", 5),
            account_age_days=sc.get("account_age_days", 90),
            failed_attempts_24h=sc.get("failed_attempts_24h", 0),
            ip_address=sc.get("ip_address", "127.0.0.1"),
            ip_country=sc.get("ip_country", "US"),
            billing_country=sc.get("billing_country", "US"),
            shipping_country=sc.get("shipping_country", sc.get("billing_country", "US")),
            device_fingerprint=sc.get("device_fingerprint", "fp-standard-desktop"),
            items_json=items_json,
            is_synthetic=True,
            source="SYNTHETIC_DEMO",
            risk_score=score,
            risk_level=risk_level,
            ml_fraud_probability=ml_prediction.get("fraud_probability", 0.0),
            hybrid_score=ml_prediction.get("hybrid_score", score),
            review_status=sc["review_status"],
            review_notes=sc["review_notes"],
            reviewed_at=(txn_time + timedelta(minutes=15)) if sc["review_status"] != "UNREVIEWED" else None,
            reviewer="Merchant Compliance" if sc["review_status"] != "UNREVIEWED" else None
        )
        db.add(txn)
        db.flush()

        # Add RiskAnalysis record
        rules_payload = [
            {
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "description": r.description,
                "score_points": r.score_points,
                "category": r.category,
                "evidence": r.evidence
            }
            for r in triggered_rules
        ]

        analysis = RiskAnalysis(
            transaction_id=txn.id,
            deterministic_score=score,
            risk_level=risk_level,
            triggered_rules_json=json.dumps(rules_payload),
            ml_fraud_probability=ml_prediction.get("fraud_probability", 0.0),
            ml_risk_tier=ml_prediction.get("ml_risk_tier", "LOW"),
            hybrid_score=ml_prediction.get("hybrid_score", score),
            feature_attributions_json=json.dumps(ml_prediction.get("top_attributions", [])),
            ai_summary=explanation_data["summary"],
            ai_explanation=explanation_data["explanation"],
            ai_uncertainties=explanation_data["uncertainties"],
            ai_recommended_steps=json.dumps(explanation_data["recommended_steps"]),
            model_used=explanation_data["model_used"]
        )
        db.add(analysis)
        created_txns.append(txn)

        # Record cryptographically chained audit log for reviewed transactions
        if sc["review_status"] != "UNREVIEWED":
            record_audit_event(
                db=db,
                action="TRANSACTION_REVIEW_UPDATED",
                entity_type="TRANSACTION",
                entity_id=sc["reference_id"],
                performed_by="Merchant Compliance",
                details={
                    "status": sc["review_status"],
                    "notes": sc["review_notes"],
                    "risk_score": score,
                    "ml_fraud_probability": ml_prediction.get("fraud_probability", 0.0)
                }
            )

    # Add final system audit log
    record_audit_event(
        db=db,
        action="DEMO_DATABASE_SEEDED",
        entity_type="SYSTEM",
        entity_id="SEED_33",
        performed_by="system_seeder",
        details={"seeded_count": len(created_txns), "status": "COMPLETED"}
    )
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully seeded {len(created_txns)} realistic synthetic demo transactions with ML and chained audit logs.",
        "count": len(created_txns)
    }
