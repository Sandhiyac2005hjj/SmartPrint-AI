"""
PrintPulse Analytics — Data Transform Module
=============================================
Cleans and normalises validated records before loading to PostgreSQL.
All functions are pure (no I/O) to simplify testing.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOMER TRANSFORMS
# ─────────────────────────────────────────────────────────────────────────────

def transform_customer(raw: dict) -> dict:
    """
    Normalise a raw customer dict for insertion into the `customers` table.
    """
    return {
        "id": str(raw["id"]).strip(),
        "customer_code": str(raw["customer_code"]).strip().upper(),
        "name": _title_case(raw.get("name", "")),
        "company": _clean_text(raw.get("company", "")),
        "phone": _normalise_phone(raw.get("phone", "")),
        "alt_phone": _normalise_phone(raw.get("alt_phone", "")),
        "email": str(raw.get("email", "")).strip().lower() or None,
        "gst_number": _clean_gst(raw.get("gst_number", "")),
        "address": _clean_text(raw.get("address", "")),
        "notes": _clean_text(raw.get("notes", "")) or None,
        "created_at": _parse_ts(raw.get("created_at")) or datetime.now(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# JOB CARD TRANSFORMS
# ─────────────────────────────────────────────────────────────────────────────

def transform_job(raw: dict) -> dict:
    """
    Normalise a raw job card dict for insertion into `job_cards`.
    Recalculates balance_amount from selling_price − advance_paid.
    """
    selling_price = _to_float(raw.get("selling_price", 0))
    advance_paid  = _to_float(raw.get("advance_paid", 0))
    estimated_cost = _to_float(raw.get("estimated_cost", 0))
    balance_amount = max(0.0, round(selling_price - advance_paid, 2))

    # Recompute payment_status from amounts
    payment_status = _derive_payment_status(selling_price, advance_paid)

    job_date_str = _format_date(raw.get("job_date"))
    delivery_date_str = _format_date(raw.get("expected_delivery_date"))
    actual_completion_str = _format_date(raw.get("actual_completion_date")) or None

    return {
        "id": str(raw["id"]).strip(),
        "job_no": str(raw["job_no"]).strip().upper(),
        "customer_id": str(raw["customer_id"]).strip(),
        "customer_name": _title_case(raw.get("customer_name", "")),
        "company": _clean_text(raw.get("company", "")),
        "phone": _normalise_phone(raw.get("phone", "")),
        "job_type": _clean_text(raw.get("job_type", "")),
        "product_name": _clean_text(raw.get("product_name", "")),
        "description": _clean_text(raw.get("description", "")) or None,
        "quantity": int(float(raw.get("quantity", 1))),
        "paper_size": _clean_text(raw.get("paper_size", "")) or None,
        "paper_gsm": _clean_text(raw.get("paper_gsm", "")) or None,
        "paper_type": _clean_text(raw.get("paper_type", "")) or None,
        "print_type": _clean_text(raw.get("print_type", "")) or None,
        "print_sides": _clean_text(raw.get("print_sides", "")) or None,
        "print_color_mode": _clean_text(raw.get("print_color_mode", "")) or None,
        "print_lamination": _clean_text(raw.get("print_lamination", "None")),
        "print_binding": _clean_text(raw.get("print_binding", "None")),
        "print_cutting": _clean_text(raw.get("print_cutting", "Standard")),
        "print_finishing": _clean_text(raw.get("print_finishing", "None")),
        "special_instructions": _clean_text(raw.get("special_instructions", "")) or None,
        "assigned_to": _clean_text(raw.get("assigned_to", "")) or None,
        "machine_used": _clean_text(raw.get("machine_used", "")) or None,
        "priority": _clean_text(raw.get("priority", "Medium")),
        "job_date": job_date_str,
        "expected_delivery_date": delivery_date_str,
        "actual_completion_date": actual_completion_str,
        "status": _clean_text(raw.get("status", "Pending")),
        "estimated_cost": estimated_cost,
        "selling_price": selling_price,
        "advance_paid": advance_paid,
        "balance_amount": balance_amount,
        "payment_status": payment_status,
        "sheets_used": _to_int(raw.get("sheets_used")),
        "waste_sheets": _to_int(raw.get("waste_sheets")),
        "rework_required": _to_bool(raw.get("rework_required", False)),
        "rework_quantity": _to_int(raw.get("rework_quantity", 0)),
        "is_on_time": _to_bool_nullable(raw.get("is_on_time")),
        "will_delay_flag": _to_bool_nullable(raw.get("will_delay_flag")),
        "lead_days": _to_int(raw.get("lead_days")),
        "complexity_score": _to_int(raw.get("complexity_score")),
        "remarks": _clean_text(raw.get("remarks", "")) or None,
        "is_draft": False,
        "is_synthetic": True,
        "created_at": _parse_ts(raw.get("created_at")) or datetime.now(),
        "updated_at": _parse_ts(raw.get("updated_at")) or datetime.now(),
    }


def transform_timeline_event(raw: dict) -> dict:
    return {
        "id": str(raw["id"]).strip(),
        "job_card_id": str(raw["job_card_id"]).strip(),
        "status": _clean_text(raw.get("status", "")),
        "timestamp": _parse_ts(raw.get("timestamp")) or datetime.now(),
        "note": _clean_text(raw.get("note", "")) or None,
        "updated_by": _clean_text(raw.get("updated_by", "")) or None,
    }


def transform_activity_log(raw: dict) -> dict:
    return {
        "id": str(raw["id"]).strip(),
        "action": _clean_text(raw.get("action", "")),
        "details": _clean_text(raw.get("details", "")),
        "timestamp": _parse_ts(raw.get("timestamp")) or datetime.now(),
        "entity_id": str(raw.get("entity_id", "")).strip() or None,
        "entity_type": str(raw.get("entity_type", "")).strip() or None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# BATCH TRANSFORMS
# ─────────────────────────────────────────────────────────────────────────────

def transform_customers(records: list[dict]) -> list[dict]:
    return [transform_customer(r) for r in records]


def transform_jobs(records: list[dict]) -> list[dict]:
    return [transform_job(r) for r in records]


def transform_timeline_events(records: list[dict]) -> list[dict]:
    return [transform_timeline_event(r) for r in records]


def transform_activity_logs(records: list[dict]) -> list[dict]:
    return [transform_activity_log(r) for r in records]


# ─────────────────────────────────────────────────────────────────────────────
# PRIVATE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    # Remove multiple consecutive spaces
    text = re.sub(r"\s{2,}", " ", text)
    # Remove null-ish strings
    if text.lower() in ("none", "null", "nan", "n/a", ""):
        return ""
    return text


def _title_case(value: Any) -> str:
    text = _clean_text(value)
    # Title-case but preserve common abbreviations
    return text.title() if text else ""


def _normalise_phone(value: Any) -> str:
    text = _clean_text(value)
    if not text:
        return ""
    # Remove all non-digit characters except leading +
    digits_only = re.sub(r"[^\d+]", "", text)
    return digits_only if digits_only else text


def _clean_gst(value: Any) -> str | None:
    text = _clean_text(value).upper()
    if not text:
        return None
    # GST format: 15 alphanumeric characters
    gst = re.sub(r"\s", "", text)
    return gst if len(gst) == 15 else text


def _format_date(value: Any) -> str | None:
    """Return ISO date string YYYY-MM-DD or None."""
    if not value or str(value).strip() in ("", "None", "nan"):
        return None
    raw = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw[:10], fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw[:10]  # fallback: return first 10 chars as-is


def _parse_ts(value: Any) -> datetime | None:
    if not value or str(value).strip() in ("", "None", "nan"):
        return None
    raw = str(value).strip()
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw[:26], fmt)
        except ValueError:
            continue
    return None


def _to_float(value: Any) -> float:
    try:
        return round(float(str(value).replace(",", "")), 2) if value else 0.0
    except (TypeError, ValueError):
        return 0.0


def _to_int(value: Any) -> int | None:
    try:
        return int(float(value)) if value is not None and str(value).strip() not in ("", "nan", "None") else None
    except (TypeError, ValueError):
        return None


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    return text in ("true", "1", "yes", "t")


def _to_bool_nullable(value: Any) -> bool | None:
    if value is None or str(value).strip().lower() in ("", "none", "nan"):
        return None
    return _to_bool(value)


def _derive_payment_status(selling: float, advance: float) -> str:
    if advance <= 0:
        return "Pending"
    if advance >= selling:
        return "Paid"
    return "Partial"
