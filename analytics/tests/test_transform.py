"""
PrintPulse Analytics — Transform Tests
========================================
Tests normalization in transform.py for field-level correctness.
Run: pytest tests/test_transform.py -v
"""

import sys
import pytest
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.transform import (
    transform_customer,
    transform_job,
    transform_customers,
    transform_jobs,
    transform_timeline_event,
)


# ── Customer transform ────────────────────────────────────────────────────────

def raw_customer(**overrides):
    base = {
        "id": "  cust-001  ",
        "customer_code": "  cust001  ",
        "name": "  john doe  ",
        "company": "Test Co Ltd",
        "phone": "+91-98765-43210",
        "alt_phone": None,
        "email": "  JOHN@TEST.COM  ",
        "gst_number": "33AAAAA0000A1Z5",
        "address": "  123 Main St  ",
        "notes": None,
        "created_at": "2025-01-15T10:30:00",
    }
    return {**base, **overrides}


class TestTransformCustomer:

    def test_id_is_stripped(self):
        r = transform_customer(raw_customer())
        assert r["id"] == "cust-001"

    def test_customer_code_is_uppercased_and_stripped(self):
        r = transform_customer(raw_customer())
        assert r["customer_code"] == "CUST001"

    def test_name_is_title_cased(self):
        r = transform_customer(raw_customer())
        assert r["name"] == "John Doe"

    def test_email_is_lowercased_and_stripped(self):
        r = transform_customer(raw_customer())
        assert r["email"] == "john@test.com"

    def test_notes_none_stays_none(self):
        r = transform_customer(raw_customer(notes=None))
        assert r["notes"] is None

    def test_created_at_is_datetime(self):
        r = transform_customer(raw_customer())
        assert isinstance(r["created_at"], datetime)

    def test_created_at_defaults_when_none(self):
        r = transform_customer(raw_customer(created_at=None))
        assert isinstance(r["created_at"], datetime)

    def test_empty_email_becomes_none(self):
        r = transform_customer(raw_customer(email=""))
        assert r["email"] is None

    def test_gst_is_cleaned(self):
        r = transform_customer(raw_customer())
        assert r["gst_number"] is not None


# ── Job transform ─────────────────────────────────────────────────────────────

def raw_job(**overrides):
    base = {
        "id": "job-001",
        "job_no": "  jc-2025-001  ",
        "customer_id": "cust-001",
        "customer_name": "test customer",
        "company": "test co",
        "phone": "9876543210",
        "job_type": "Brochure",
        "product_name": "  Company Brochure  ",
        "description": "A nice brochure",
        "quantity": "500",
        "paper_size": "A4",
        "paper_gsm": "130",
        "paper_type": "Art Paper",
        "print_type": "Offset",
        "print_sides": "Double Side",
        "print_color_mode": "CMYK",
        "print_lamination": "None",
        "print_binding": "None",
        "print_cutting": "Standard",
        "print_finishing": "None",
        "special_instructions": None,
        "assigned_to": "Ravi",
        "machine_used": None,
        "priority": "High",
        "job_date": "2025-03-01",
        "expected_delivery_date": "2025-03-08",
        "actual_completion_date": "2025-03-07",
        "status": "Delivered",
        "estimated_cost": "1000.0",
        "selling_price": "1500.0",
        "advance_paid": "750.0",
        "balance_amount": "999.99",      # wrong raw — should be recalculated
        "payment_status": "Partial",
        "sheets_used": "520",
        "waste_sheets": "20",
        "rework_required": False,
        "rework_quantity": 0,
        "is_on_time": True,
        "will_delay_flag": False,
        "lead_days": "7",
        "complexity_score": "3",
        "remarks": None,
        "created_at": "2025-03-01T09:00:00",
        "updated_at": "2025-03-07T16:00:00",
    }
    return {**base, **overrides}


class TestTransformJob:

    def test_job_no_uppercased_and_stripped(self):
        r = transform_job(raw_job())
        assert r["job_no"] == "JC-2025-001"

    def test_quantity_converted_to_int(self):
        r = transform_job(raw_job())
        assert isinstance(r["quantity"], int)
        assert r["quantity"] == 500

    def test_selling_price_is_float(self):
        r = transform_job(raw_job())
        assert isinstance(r["selling_price"], float)
        assert r["selling_price"] == 1500.0

    def test_estimated_cost_is_float(self):
        r = transform_job(raw_job())
        assert isinstance(r["estimated_cost"], float)
        assert r["estimated_cost"] == 1000.0

    def test_balance_amount_recalculated(self):
        """balance = selling_price - advance_paid, ignoring the raw value."""
        r = transform_job(raw_job(selling_price="2000.0", advance_paid="500.0"))
        assert r["balance_amount"] == 1500.0

    def test_balance_never_negative(self):
        """If advance > selling, balance should clamp to 0."""
        r = transform_job(raw_job(selling_price="1000.0", advance_paid="2000.0"))
        assert r["balance_amount"] == 0.0

    def test_payment_status_paid_when_full_advance(self):
        r = transform_job(raw_job(selling_price="1000.0", advance_paid="1000.0"))
        assert r["payment_status"] == "Paid"

    def test_payment_status_pending_when_no_advance(self):
        r = transform_job(raw_job(advance_paid="0"))
        assert r["payment_status"] == "Pending"

    def test_payment_status_partial_for_partial_advance(self):
        r = transform_job(raw_job(selling_price="1000.0", advance_paid="500.0"))
        assert r["payment_status"] == "Partial"

    def test_is_synthetic_always_true(self):
        r = transform_job(raw_job())
        assert r["is_synthetic"] is True

    def test_is_draft_always_false(self):
        r = transform_job(raw_job())
        assert r["is_draft"] is False

    def test_customer_name_title_cased(self):
        r = transform_job(raw_job())
        assert r["customer_name"] == "Test Customer"

    def test_job_date_is_string(self):
        r = transform_job(raw_job())
        assert r["job_date"] == "2025-03-01"

    def test_delivery_date_is_string(self):
        r = transform_job(raw_job())
        assert r["expected_delivery_date"] == "2025-03-08"

    def test_actual_completion_date_is_string_when_present(self):
        r = transform_job(raw_job())
        assert r["actual_completion_date"] == "2025-03-07"

    def test_none_actual_completion_stays_none(self):
        r = transform_job(raw_job(actual_completion_date=None))
        assert r["actual_completion_date"] is None

    def test_sheets_used_is_int(self):
        r = transform_job(raw_job())
        assert isinstance(r["sheets_used"], int)
        assert r["sheets_used"] == 520

    def test_created_at_is_datetime(self):
        r = transform_job(raw_job())
        assert isinstance(r["created_at"], datetime)

    def test_updated_at_is_datetime(self):
        r = transform_job(raw_job())
        assert isinstance(r["updated_at"], datetime)

    def test_remarks_none_when_empty_string(self):
        r = transform_job(raw_job(remarks=""))
        assert r["remarks"] is None

    def test_special_instructions_none(self):
        r = transform_job(raw_job(special_instructions=None))
        assert r["special_instructions"] is None

    def test_is_on_time_true_bool(self):
        r = transform_job(raw_job(is_on_time=True))
        assert r["is_on_time"] is True

    def test_is_on_time_from_string_true(self):
        r = transform_job(raw_job(is_on_time="true"))
        assert r["is_on_time"] is True

    def test_is_on_time_false_from_false(self):
        r = transform_job(raw_job(is_on_time=False))
        assert r["is_on_time"] is False

    def test_rework_required_bool_from_string(self):
        r = transform_job(raw_job(rework_required="False"))
        assert r["rework_required"] is False

    def test_rework_true(self):
        r = transform_job(raw_job(rework_required=True))
        assert r["rework_required"] is True

    def test_lead_days_is_int(self):
        r = transform_job(raw_job())
        assert isinstance(r["lead_days"], int)
        assert r["lead_days"] == 7

    def test_complexity_score_is_int(self):
        r = transform_job(raw_job())
        assert isinstance(r["complexity_score"], int)
        assert r["complexity_score"] == 3


# ── Timeline event transform ──────────────────────────────────────────────────

class TestTransformTimelineEvent:

    def test_basic_transform(self):
        raw = {
            "id": "evt-001",
            "job_card_id": "job-001",
            "status": "  Printing  ",
            "timestamp": "2025-03-02T10:00:00",
            "note": "Plate ready",
            "updated_by": "Operator",
        }
        r = transform_timeline_event(raw)
        assert r["id"] == "evt-001"
        assert r["job_card_id"] == "job-001"
        assert r["status"] == "Printing"
        assert isinstance(r["timestamp"], datetime)
        assert r["note"] == "Plate ready"

    def test_none_note_becomes_none(self):
        raw = {
            "id": "evt-002", "job_card_id": "job-001",
            "status": "Delivered", "timestamp": "2025-03-07T16:00:00",
            "note": None, "updated_by": None,
        }
        r = transform_timeline_event(raw)
        assert r["note"] is None


# ── Batch transforms ──────────────────────────────────────────────────────────

class TestBatchTransforms:

    def test_transform_customers_returns_same_count(self):
        raws = [
            {
                "id": f"c{i}", "customer_code": f"CODE{i:03d}", "name": f"Customer {i}",
                "company": "Co", "phone": "9999999999",
                "alt_phone": None, "email": None, "gst_number": None,
                "address": "Addr", "notes": None, "created_at": None,
            }
            for i in range(8)
        ]
        results = transform_customers(raws)
        assert len(results) == 8

    def test_transform_jobs_returns_same_count(self):
        raws = [raw_job(id=f"j{i}", job_no=f"JC-{i:05d}") for i in range(6)]
        results = transform_jobs(raws)
        assert len(results) == 6

    def test_transform_customers_empty(self):
        assert transform_customers([]) == []

    def test_transform_jobs_empty(self):
        assert transform_jobs([]) == []

    def test_all_transformed_jobs_are_synthetic(self):
        raws = [raw_job(id=f"j{i}", job_no=f"JC-{i:05d}") for i in range(3)]
        results = transform_jobs(raws)
        assert all(r["is_synthetic"] is True for r in results)

    def test_all_transformed_jobs_not_draft(self):
        raws = [raw_job(id=f"j{i}", job_no=f"JC-{i:05d}") for i in range(3)]
        results = transform_jobs(raws)
        assert all(r["is_draft"] is False for r in results)
