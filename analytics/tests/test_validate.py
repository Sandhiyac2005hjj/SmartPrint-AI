"""
PrintPulse Analytics — Validation Tests
========================================
Tests matching the exact API of pipeline/validate.py.
Run: pytest tests/test_validate.py -v
"""

import sys
import pytest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.validate import (
    validate_customers_batch as validate_customers,
    validate_jobs_batch      as validate_jobs,
    check_required_fields,
    check_quantity,
    check_date_consistency,
    check_status_enum,
    check_payment_status_enum,
    check_price_consistency,
    check_price_non_negative,
    check_customer_id_format,
    find_duplicate_job_nos,
    find_duplicate_ids,
    check_referential_integrity,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_customers(*ids):
    """Return a list of minimal valid customer dicts for use in validate_jobs."""
    return [
        {"id": cid, "customer_code": f"C{i:04d}", "name": f"Customer {i}",
         "company": "Co", "phone": "9999999999", "created_at": "2025-01-01"}
        for i, cid in enumerate(ids)
    ]


def valid_customer(**overrides):
    base = {
        "id": "cust-001",
        "customer_code": "CUST001",
        "name": "Test Customer",
        "company": "Test Co",
        "phone": "9876543210",
        "address": "123 Test Street, Chennai",
        "created_at": "2025-01-15",
    }
    return {**base, **overrides}


def valid_job(**overrides):
    base = {
        "id": "job-001",
        "job_no": "JC-2025-001",
        "customer_id": "cust-001",
        "customer_name": "Test Customer",
        "company": "Test Co",
        "job_type": "Brochure",
        "product_name": "Company Brochure",
        "quantity": 500,
        "status": "Delivered",
        "selling_price": 1500.0,
        "estimated_cost": 1000.0,
        "advance_paid": 750.0,
        "balance_amount": 750.0,
        "payment_status": "Partial",
        "job_date": "2025-03-01",
        "expected_delivery_date": "2025-03-08",
        "created_at": "2025-01-01",
    }
    return {**base, **overrides}


# ── Unit rule tests ───────────────────────────────────────────────────────────

class TestCheckRequiredFields:

    def test_all_fields_present_passes(self):
        assert check_required_fields({"a": "x", "b": "y"}, ["a", "b"]) == []

    def test_missing_field_fails(self):
        assert len(check_required_fields({"a": "x"}, ["a", "b"])) > 0

    def test_none_value_fails(self):
        assert len(check_required_fields({"a": None}, ["a"])) > 0

    def test_empty_string_fails(self):
        assert len(check_required_fields({"a": ""}, ["a"])) > 0

    def test_whitespace_only_fails(self):
        assert len(check_required_fields({"a": "   "}, ["a"])) > 0

    def test_zero_int_passes(self):
        """Numeric 0 is a valid (non-null) value."""
        assert check_required_fields({"count": 0}, ["count"]) == []

    def test_false_bool_passes(self):
        """False is a valid non-null value."""
        assert check_required_fields({"flag": False}, ["flag"]) == []


class TestCheckQuantity:

    def test_valid_quantity_passes(self):
        assert check_quantity({"quantity": 500}) == []

    def test_one_passes(self):
        assert check_quantity({"quantity": 1}) == []

    def test_zero_fails(self):
        assert len(check_quantity({"quantity": 0})) > 0

    def test_negative_fails(self):
        assert len(check_quantity({"quantity": -10})) > 0

    def test_none_fails(self):
        assert len(check_quantity({"quantity": None})) > 0

    def test_string_number_passes(self):
        """String-encoded numbers are accepted."""
        assert check_quantity({"quantity": "100"}) == []


class TestCheckDateConsistency:

    def test_delivery_after_job_date_passes(self):
        r = {"job_date": "2025-03-01", "expected_delivery_date": "2025-03-08"}
        assert check_date_consistency(r) == []

    def test_delivery_same_day_passes(self):
        r = {"job_date": "2025-03-01", "expected_delivery_date": "2025-03-01"}
        assert check_date_consistency(r) == []

    def test_delivery_before_job_date_fails(self):
        r = {"job_date": "2025-03-08", "expected_delivery_date": "2025-03-01"}
        assert len(check_date_consistency(r)) > 0

    def test_both_none_passes(self):
        """If dates are missing, the check is skipped (no error)."""
        r = {"job_date": None, "expected_delivery_date": None}
        assert check_date_consistency(r) == []


class TestCheckStatusEnum:

    @pytest.mark.parametrize("status", [
        "Pending", "Designing", "Printing", "Finishing", "Ready", "Delivered", "Cancelled"
    ])
    def test_valid_statuses_pass(self, status):
        assert check_status_enum({"status": status}) == []

    def test_invalid_status_fails(self):
        assert len(check_status_enum({"status": "FLYING"})) > 0

    def test_none_status_fails(self):
        assert len(check_status_enum({"status": None})) > 0

    def test_empty_status_fails(self):
        assert len(check_status_enum({"status": ""})) > 0


class TestCheckPaymentStatusEnum:

    @pytest.mark.parametrize("ps", ["Pending", "Partial", "Paid"])
    def test_valid_payment_statuses_pass(self, ps):
        assert check_payment_status_enum({"payment_status": ps}) == []

    def test_invalid_fails(self):
        assert len(check_payment_status_enum({"payment_status": "INVALID"})) > 0

    def test_none_passes(self):
        """None payment_status is not flagged by this rule."""
        assert check_payment_status_enum({"payment_status": None}) == []


class TestCheckPriceConsistency:
    """
    check_price_consistency: selling_price must be >= estimated_cost.
    Only raises error when BOTH values > 0 AND selling < estimated.
    """

    def test_selling_above_cost_passes(self):
        r = {"selling_price": 1500.0, "estimated_cost": 1000.0}
        assert check_price_consistency(r) == []

    def test_selling_equals_cost_passes(self):
        r = {"selling_price": 1000.0, "estimated_cost": 1000.0}
        assert check_price_consistency(r) == []

    def test_selling_below_cost_fails(self):
        r = {"selling_price": 500.0, "estimated_cost": 1000.0}
        assert len(check_price_consistency(r)) > 0

    def test_zero_cost_passes(self):
        """If estimated_cost is 0, check is skipped."""
        r = {"selling_price": 500.0, "estimated_cost": 0}
        assert check_price_consistency(r) == []


class TestCheckPriceNonNegative:

    def test_positive_passes(self):
        r = {"selling_price": 1500.0, "estimated_cost": 1000.0,
             "advance_paid": 500.0, "balance_amount": 1000.0}
        assert check_price_non_negative(r) == []

    def test_negative_selling_price_fails(self):
        assert len(check_price_non_negative({"selling_price": -100})) > 0

    def test_negative_advance_fails(self):
        assert len(check_price_non_negative({"advance_paid": -50})) > 0

    def test_zero_all_passes(self):
        r = {"selling_price": 0, "estimated_cost": 0,
             "advance_paid": 0, "balance_amount": 0}
        assert check_price_non_negative(r) == []


class TestDuplicateDetection:

    def test_unique_job_nos_returns_empty(self):
        jobs = [{"job_no": f"JC-{i:04d}"} for i in range(5)]
        assert find_duplicate_job_nos(jobs) == set()

    def test_duplicate_job_nos_detected(self):
        jobs = [{"job_no": "JC-0001"}, {"job_no": "JC-0001"}, {"job_no": "JC-0002"}]
        dups = find_duplicate_job_nos(jobs)
        assert "JC-0001" in dups
        assert "JC-0002" not in dups

    def test_unique_ids_returns_empty(self):
        records = [{"id": f"id-{i}"} for i in range(5)]
        assert find_duplicate_ids(records) == set()

    def test_duplicate_ids_detected(self):
        records = [{"id": "dup-id"}, {"id": "dup-id"}]
        assert "dup-id" in find_duplicate_ids(records)


class TestReferentialIntegrity:

    def test_known_customer_id_passes(self):
        jobs = [{"id": "j1", "customer_id": "c1"}]
        errors = check_referential_integrity(jobs, {"c1", "c2"})
        assert errors == {}

    def test_unknown_customer_id_flagged(self):
        jobs = [{"id": "j1", "customer_id": "ghost-id"}]
        errors = check_referential_integrity(jobs, {"c1"})
        assert "j1" in errors

    def test_empty_customer_id_not_flagged(self):
        """Empty customer_id is caught by null_check, not referential integrity."""
        jobs = [{"id": "j1", "customer_id": ""}]
        errors = check_referential_integrity(jobs, {"c1"})
        assert "j1" not in errors


# ── Customer batch tests ──────────────────────────────────────────────────────

class TestCustomerBatchValidation:

    def test_single_valid_customer(self):
        v, r = validate_customers([valid_customer()])
        assert len(v) == 1 and len(r) == 0

    def test_ten_valid_customers(self):
        custs = [valid_customer(id=f"c{i}", customer_code=f"C{i:04d}") for i in range(10)]
        v, r = validate_customers(custs)
        assert len(v) == 10 and len(r) == 0

    def test_missing_id_rejected(self):
        _, rejected = validate_customers([valid_customer(id=None)])
        assert len(rejected) == 1

    def test_missing_name_rejected(self):
        _, rejected = validate_customers([valid_customer(name=None)])
        assert len(rejected) == 1

    def test_empty_customer_code_rejected(self):
        _, rejected = validate_customers([valid_customer(customer_code="")])
        assert len(rejected) == 1

    def test_missing_phone_rejected(self):
        _, rejected = validate_customers([valid_customer(phone=None)])
        assert len(rejected) == 1

    def test_empty_list(self):
        v, r = validate_customers([])
        assert v == [] and r == []

    def test_rejected_record_has_rejection_rule(self):
        _, rejected = validate_customers([valid_customer(id=None)])
        assert "rejection_rule" in rejected[0]
        assert rejected[0]["rejection_rule"]

    def test_mixed_batch_correct_counts(self):
        valids   = [valid_customer(id=f"c{i}", customer_code=f"C{i:04d}") for i in range(5)]
        invalids = [valid_customer(id=None), valid_customer(phone=None)]
        v, r = validate_customers(valids + invalids)
        assert len(v) == 5 and len(r) == 2


# ── Job batch tests ───────────────────────────────────────────────────────────

class TestJobBatchValidation:

    def test_single_valid_job(self):
        custs = make_customers("cust-001")
        v, r = validate_jobs([valid_job()], custs)
        assert len(v) == 1 and len(r) == 0

    def test_missing_customer_id_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(customer_id=None)], custs)
        assert len(r) == 1

    def test_unknown_customer_id_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(customer_id="ghost-xyz")], custs)
        assert len(r) == 1

    def test_missing_job_type_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(job_type=None)], custs)
        assert len(r) == 1

    def test_zero_quantity_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(quantity=0)], custs)
        assert len(r) == 1

    def test_negative_quantity_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(quantity=-5)], custs)
        assert len(r) == 1

    def test_invalid_status_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(status="INVALID")], custs)
        assert len(r) == 1

    def test_invalid_payment_status_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(payment_status="BOGUS")], custs)
        assert len(r) == 1

    def test_delivery_before_job_date_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(
            job_date="2025-05-10",
            expected_delivery_date="2025-05-01",
        )], custs)
        assert len(r) == 1

    def test_missing_customer_name_rejected(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(customer_name=None)], custs)
        assert len(r) == 1

    def test_duplicate_job_no_quarantine(self):
        custs = make_customers("cust-001")
        jobs = [valid_job(), valid_job()]  # same job_no
        v, r = validate_jobs(jobs, custs)
        assert len(v) + len(r) == 2

    def test_rejected_has_rejection_rule(self):
        custs = make_customers("cust-001")
        _, r = validate_jobs([valid_job(quantity=0)], custs)
        assert "rejection_rule" in r[0] and r[0]["rejection_rule"]

    def test_correct_batch_counts(self):
        """10 valid + 3 invalid → 10 valid, 3 rejected."""
        custs    = make_customers("cust-001")
        valids   = [valid_job(id=f"j{i}", job_no=f"JC-{i:05d}") for i in range(10)]
        invalids = [
            valid_job(id="bad1", job_no="BAD001", quantity=0),
            valid_job(id="bad2", job_no="BAD002", status="INVALID"),
            valid_job(id="bad3", job_no="BAD003", job_type=None),
        ]
        v, r = validate_jobs(valids + invalids, custs)
        assert len(v) == 10 and len(r) == 3

    def test_empty_jobs(self):
        v, r = validate_jobs([], make_customers("cust-001"))
        assert v == [] and r == []
