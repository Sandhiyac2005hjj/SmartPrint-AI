"""
PrintPulse Analytics — Data Validation Module
==============================================
Validates CSV records before loading into PostgreSQL.
Each check is a pure function that returns a list of error strings.
An empty list means the record passed that check.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
VALID_JOB_TYPES = {
    "Visiting Card", "Brochure", "Flex", "Offset", "Sticker",
    "Letterhead", "Envelope", "Invitation", "Catalogue", "Poster",
    "Bill Book", "Label", "Packaging Box", "Carry Bag", "Standee",
}

VALID_STATUSES = {
    "Pending", "Designing", "Printing", "Finishing",
    "Ready", "Delivered", "Cancelled",
}

VALID_PAYMENT_STATUSES = {"Pending", "Partial", "Paid"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Urgent"}
VALID_PRINT_SIDES = {"Single Side", "Double Side"}

REQUIRED_CUSTOMER_FIELDS = ["id", "customer_code", "name", "company",
                             "phone", "address"]
REQUIRED_JOB_FIELDS = [
    "id", "job_no", "customer_id", "customer_name",
    "company", "job_type", "quantity", "job_date",
    "expected_delivery_date", "status", "selling_price",
]

TODAY = date.today()
MAX_FUTURE_DAYS = 30   # allow up to 30 days in the future for delivery dates


# ─────────────────────────────────────────────────────────────────────────────
# INDIVIDUAL RULE FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def check_required_fields(record: dict, required: list[str]) -> list[str]:
    """Rule: required fields must be non-null and non-empty."""
    errors = []
    for field in required:
        val = record.get(field)
        if val is None or str(val).strip() == "" or str(val).lower() == "none":
            errors.append(f"null_check.{field}: required field is null/empty")
    return errors


def check_quantity(record: dict) -> list[str]:
    """Rule: quantity must be a positive integer."""
    try:
        qty = int(float(record.get("quantity", 0)))
        if qty <= 0:
            return [f"range_check.quantity: quantity={qty} must be > 0"]
    except (TypeError, ValueError):
        return [f"type_check.quantity: '{record.get('quantity')}' is not a valid integer"]
    return []


def check_date_consistency(record: dict) -> list[str]:
    """Rule: expected_delivery_date must be >= job_date."""
    errors = []
    try:
        job_date = _parse_date(record.get("job_date"))
        delivery_date = _parse_date(record.get("expected_delivery_date"))
        if job_date and delivery_date and delivery_date < job_date:
            errors.append(
                f"date_consistency.expected_delivery_date: "
                f"delivery date {delivery_date} is before job_date {job_date}"
            )
    except Exception as e:
        errors.append(f"date_parse_error: {e}")
    return errors


def check_created_at_not_future(record: dict) -> list[str]:
    """Rule: created_at must not be more than MAX_FUTURE_DAYS in the future."""
    errors = []
    try:
        raw = record.get("created_at")
        if raw and str(raw).strip():
            dt = _parse_datetime(raw)
            if dt and dt.date() > TODAY + __import__("datetime").timedelta(
                    days=MAX_FUTURE_DAYS):
                errors.append(
                    f"temporal_check.created_at: "
                    f"created_at={dt.date()} is more than "
                    f"{MAX_FUTURE_DAYS} days in the future"
                )
    except Exception as e:
        errors.append(f"temporal_parse_error.created_at: {e}")
    return errors


def check_price_consistency(record: dict) -> list[str]:
    """Rule: selling_price must be >= estimated_cost."""
    errors = []
    try:
        selling = float(record.get("selling_price") or 0)
        estimated = float(record.get("estimated_cost") or 0)
        if selling > 0 and estimated > 0 and selling < estimated:
            errors.append(
                f"business_rule.selling_price: "
                f"selling_price={selling} < estimated_cost={estimated}"
            )
    except (TypeError, ValueError) as e:
        errors.append(f"type_check.price: {e}")
    return errors


def check_balance_consistency(record: dict) -> list[str]:
    """Rule: balance_amount must equal selling_price - advance_paid (±1 INR rounding)."""
    errors = []
    try:
        selling = float(record.get("selling_price") or 0)
        advance = float(record.get("advance_paid") or 0)
        balance = float(record.get("balance_amount") or 0)
        expected_balance = max(0.0, selling - advance)
        if abs(balance - expected_balance) > 1.0:
            errors.append(
                f"business_rule.balance_amount: "
                f"balance={balance} ≠ selling−advance={expected_balance:.2f}"
            )
    except (TypeError, ValueError):
        pass  # non-fatal if prices are missing
    return errors


def check_status_enum(record: dict) -> list[str]:
    """Rule: status must be a known value."""
    status = record.get("status")
    if status is None or str(status).strip() == "" or str(status).lower() == "none":
        return ["null_check.status: status is null/empty"]
    if str(status) not in VALID_STATUSES:
        return [f"enum_check.status: '{status}' is not a valid job status"]
    return []


def check_payment_status_enum(record: dict) -> list[str]:
    """Rule: payment_status must be Pending/Partial/Paid."""
    ps = record.get("payment_status")
    if ps and str(ps) not in VALID_PAYMENT_STATUSES:
        return [f"enum_check.payment_status: '{ps}' is not a valid payment status"]
    return []


def check_job_type_enum(record: dict) -> list[str]:
    """Rule: job_type must be a known category."""
    jt = record.get("job_type")
    if not jt or str(jt).strip() == "":
        return ["null_check.job_type: job_type is empty"]
    if str(jt) not in VALID_JOB_TYPES:
        return [f"enum_check.job_type: '{jt}' is not a known job type"]
    return []


def check_customer_id_format(record: dict) -> list[str]:
    """Rule: customer_id must be non-empty."""
    cid = record.get("customer_id")
    if not cid or str(cid).strip() == "":
        return ["null_check.customer_id: customer_id is empty"]
    return []


def check_price_non_negative(record: dict) -> list[str]:
    """Rule: financial fields must be >= 0."""
    errors = []
    for field in ("selling_price", "estimated_cost", "advance_paid",
                  "balance_amount"):
        val = record.get(field)
        if val is not None and str(val).strip():
            try:
                if float(val) < 0:
                    errors.append(
                        f"range_check.{field}: value={val} must be >= 0"
                    )
            except (TypeError, ValueError):
                errors.append(
                    f"type_check.{field}: '{val}' is not a valid number"
                )
    return errors


# ─────────────────────────────────────────────────────────────────────────────
# DUPLICATE DETECTION
# ─────────────────────────────────────────────────────────────────────────────

def find_duplicate_job_nos(records: list[dict]) -> set[str]:
    """Return a set of job_no values that appear more than once."""
    seen: dict[str, int] = {}
    for r in records:
        jno = str(r.get("job_no", "")).strip()
        seen[jno] = seen.get(jno, 0) + 1
    return {jno for jno, cnt in seen.items() if cnt > 1}


def find_duplicate_ids(records: list[dict]) -> set[str]:
    """Return a set of id values that appear more than once."""
    seen: dict[str, int] = {}
    for r in records:
        rid = str(r.get("id", "")).strip()
        seen[rid] = seen.get(rid, 0) + 1
    return {rid for rid, cnt in seen.items() if cnt > 1}


# ─────────────────────────────────────────────────────────────────────────────
# REFERENTIAL INTEGRITY
# ─────────────────────────────────────────────────────────────────────────────

def check_referential_integrity(jobs: list[dict],
                                customer_ids: set[str]) -> dict[str, list[str]]:
    """
    Returns a mapping of job_id → list_of_errors for referential integrity.
    Checks that each job's customer_id exists in the customers set.
    """
    errors_by_id: dict[str, list[str]] = {}
    for job in jobs:
        cid = str(job.get("customer_id", "")).strip()
        if cid and cid not in customer_ids:
            jid = job.get("id", "unknown")
            errors_by_id[jid] = [
                f"referential_integrity.customer_id: "
                f"customer_id='{cid}' not found in customers table"
            ]
    return errors_by_id


# ─────────────────────────────────────────────────────────────────────────────
# MAIN VALIDATION ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

def validate_job_record(record: dict,
                        duplicate_job_nos: set[str],
                        duplicate_ids: set[str],
                        ref_errors: dict[str, list[str]]) -> list[str]:
    """
    Run all validation rules against a single job record.
    Returns a list of error strings. Empty → record is valid.
    """
    errors: list[str] = []

    # Required fields
    errors.extend(check_required_fields(record, REQUIRED_JOB_FIELDS))

    # Individual field rules
    for rule_fn in [
        check_quantity,
        check_date_consistency,
        check_created_at_not_future,
        check_price_consistency,
        check_balance_consistency,
        check_status_enum,
        check_payment_status_enum,
        check_job_type_enum,
        check_customer_id_format,
        check_price_non_negative,
    ]:
        errors.extend(rule_fn(record))

    # Duplicate checks
    jno = str(record.get("job_no", "")).strip()
    if jno in duplicate_job_nos:
        errors.append(
            f"uniqueness_check.job_no: job_no='{jno}' is duplicated in source"
        )

    rid = str(record.get("id", "")).strip()
    if rid in duplicate_ids:
        errors.append(
            f"uniqueness_check.id: id='{rid}' is duplicated in source"
        )

    # Referential integrity
    if rid in ref_errors:
        errors.extend(ref_errors[rid])

    return errors


def validate_customer_record(record: dict) -> list[str]:
    """Validate a single customer record."""
    return check_required_fields(record, REQUIRED_CUSTOMER_FIELDS)


# ─────────────────────────────────────────────────────────────────────────────
# BATCH VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def validate_jobs_batch(jobs: list[dict],
                        customers: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Validate all job records.
    Returns (valid_records, invalid_records_with_reasons).
    invalid_records include an additional 'rejection_reasons' key.
    """
    customer_ids = {str(c["id"]).strip() for c in customers}
    duplicate_job_nos = find_duplicate_job_nos(jobs)
    duplicate_ids = find_duplicate_ids(jobs)
    ref_errors = check_referential_integrity(jobs, customer_ids)

    valid = []
    invalid = []

    for i, record in enumerate(jobs):
        errors = validate_job_record(
            record, duplicate_job_nos, duplicate_ids, ref_errors
        )
        if errors:
            enriched = {**record}
            enriched["rejection_reasons"] = "; ".join(errors)
            enriched["rejection_rule"] = errors[0].split(":")[0]
            enriched["source_row_index"] = i
            invalid.append(enriched)
        else:
            valid.append(record)

    return valid, invalid


def validate_customers_batch(customers: list[dict]) -> tuple[list[dict], list[dict]]:
    """Validate all customer records."""
    valid, invalid = [], []
    for i, record in enumerate(customers):
        errors = validate_customer_record(record)
        if errors:
            enriched = {**record}
            enriched["rejection_reasons"] = "; ".join(errors)
            enriched["rejection_rule"] = errors[0].split(":")[0]
            enriched["source_row_index"] = i
            invalid.append(enriched)
        else:
            valid.append(record)
    return valid, invalid


# ─────────────────────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def _parse_date(value: Any) -> date | None:
    if not value or str(value).strip() in ("", "None", "nan"):
        return None
    raw = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw[:10], fmt).date()
        except ValueError:
            continue
    return None


def _parse_datetime(value: Any) -> datetime | None:
    if not value or str(value).strip() in ("", "None", "nan"):
        return None
    raw = str(value).strip()
    for fmt in (
        "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw[:26], fmt)
        except ValueError:
            continue
    return None
