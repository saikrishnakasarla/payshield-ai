import time
from typing import Dict, Any
from threading import Lock

class OperationalMetrics:
    def __init__(self):
        self._lock = Lock()
        self.start_time = time.time()
        self.requests_total: int = 0
        self.requests_by_status: Dict[int, int] = {}
        self.requests_by_method: Dict[str, int] = {}
        self.total_duration_ms: float = 0.0
        self.database_errors: int = 0
        self.paypal_api_calls: int = 0
        self.paypal_failures: int = 0
        self.payment_captures_total: int = 0
        self.payment_captures_failed: int = 0
        self.webhooks_received: int = 0
        self.webhooks_duplicate: int = 0
        self.ai_explanations_total: int = 0
        self.ai_fallbacks_total: int = 0
        self.ai_timeouts_total: int = 0

    def record_request(self, method: str, status_code: int, duration_ms: float):
        with self._lock:
            self.requests_total += 1
            self.requests_by_status[status_code] = self.requests_by_status.get(status_code, 0) + 1
            self.requests_by_method[method] = self.requests_by_method.get(method, 0) + 1
            self.total_duration_ms += duration_ms

    def record_database_error(self):
        with self._lock:
            self.database_errors += 1

    def record_paypal_call(self, success: bool = True):
        with self._lock:
            self.paypal_api_calls += 1
            if not success:
                self.paypal_failures += 1

    def record_capture(self, success: bool = True):
        with self._lock:
            self.payment_captures_total += 1
            if not success:
                self.payment_captures_failed += 1

    def record_webhook(self, is_duplicate: bool = False):
        with self._lock:
            self.webhooks_received += 1
            if is_duplicate:
                self.webhooks_duplicate += 1

    def record_ai_inference(self, is_fallback: bool = False, is_timeout: bool = False):
        with self._lock:
            self.ai_explanations_total += 1
            if is_fallback:
                self.ai_fallbacks_total += 1
            if is_timeout:
                self.ai_timeouts_total += 1

    def get_summary(self) -> Dict[str, Any]:
        with self._lock:
            uptime_seconds = round(time.time() - self.start_time, 1)
            avg_latency = round(self.total_duration_ms / max(1, self.requests_total), 2)
            
            # Count 4xx and 5xx errors
            client_errors = sum(v for k, v in self.requests_by_status.items() if 400 <= k < 500)
            server_errors = sum(v for k, v in self.requests_by_status.items() if k >= 500)
            error_rate_pct = round(((client_errors + server_errors) / max(1, self.requests_total)) * 100, 2)

            return {
                "uptime_seconds": uptime_seconds,
                "requests": {
                    "total": self.requests_total,
                    "avg_latency_ms": avg_latency,
                    "error_rate_pct": error_rate_pct,
                    "by_status": dict(self.requests_by_status),
                    "by_method": dict(self.requests_by_method)
                },
                "database": {
                    "errors_total": self.database_errors
                },
                "payment_gateways": {
                    "paypal_api_calls": self.paypal_api_calls,
                    "paypal_failures": self.paypal_failures,
                    "captures_total": self.payment_captures_total,
                    "captures_failed": self.payment_captures_failed,
                    "webhooks_received": self.webhooks_received,
                    "webhooks_duplicate": self.webhooks_duplicate
                },
                "ai_intelligence": {
                    "explanations_total": self.ai_explanations_total,
                    "fallbacks_total": self.ai_fallbacks_total,
                    "timeouts_total": self.ai_timeouts_total
                }
            }

# Global singleton
metrics = OperationalMetrics()
