"""
PrintPulse Analytics — Database Loader Module
=============================================
Idempotent upsert loader for PostgreSQL via SQLAlchemy.
Re-running the pipeline with the same batch will NOT create duplicates.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# CONNECTION
# ─────────────────────────────────────────────────────────────────────────────

def get_engine(db_url: str):
    """Create a SQLAlchemy engine. Call once per pipeline run."""
    return create_engine(db_url, pool_pre_ping=True, echo=False)


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMA BOOTSTRAP
# ─────────────────────────────────────────────────────────────────────────────

BOOTSTRAP_SQL = """
-- Analytics extensions to the existing schema
-- Run once; safe to re-run (all IF NOT EXISTS)

-- Add analytics columns to job_cards if they don't exist
ALTER TABLE job_cards
    ADD COLUMN IF NOT EXISTS actual_completion_date    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sheets_used               INTEGER,
    ADD COLUMN IF NOT EXISTS waste_sheets              INTEGER,
    ADD COLUMN IF NOT EXISTS rework_required           BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rework_quantity           INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_on_time                BOOLEAN,
    ADD COLUMN IF NOT EXISTS will_delay_flag           BOOLEAN,
    ADD COLUMN IF NOT EXISTS lead_days                 INTEGER,
    ADD COLUMN IF NOT EXISTS complexity_score          INTEGER,
    ADD COLUMN IF NOT EXISTS is_synthetic              BOOLEAN DEFAULT FALSE;

-- Pipeline runs tracking table
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id                SERIAL PRIMARY KEY,
    run_id            VARCHAR(100) UNIQUE NOT NULL,
    started_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at       TIMESTAMP,
    status            VARCHAR(20) NOT NULL DEFAULT 'running',
    source_file       VARCHAR(255) NOT NULL,
    total_records     INTEGER DEFAULT 0,
    accepted_records  INTEGER DEFAULT 0,
    rejected_records  INTEGER DEFAULT 0,
    error_message     TEXT,
    run_duration_secs FLOAT
);

-- Quarantine table for rejected records
CREATE TABLE IF NOT EXISTS quarantine_records (
    id                SERIAL PRIMARY KEY,
    run_id            VARCHAR(100) NOT NULL,
    source_row_index  INTEGER,
    raw_data          TEXT NOT NULL,
    rejection_reasons TEXT NOT NULL,
    rejection_rule    VARCHAR(100),
    quarantined_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    entity_id VARCHAR(100),
    entity_type VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status    ON pipeline_runs (status);
CREATE INDEX IF NOT EXISTS idx_quarantine_run_id       ON quarantine_records (run_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_synthetic     ON job_cards (is_synthetic);
CREATE INDEX IF NOT EXISTS idx_job_cards_delivery_date ON job_cards (expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_job_cards_job_type      ON job_cards (job_type);
"""


def bootstrap_schema(engine) -> None:
    """Create analytics tables / columns if they don't exist."""
    log.info("Bootstrapping analytics schema extensions...")
    with engine.begin() as conn:
        conn.execute(text(BOOTSTRAP_SQL))
    log.info("Schema bootstrap complete.")


# ─────────────────────────────────────────────────────────────────────────────
# PIPELINE RUN TRACKING
# ─────────────────────────────────────────────────────────────────────────────

def start_run(engine, run_id: str, source_file: str) -> None:
    sql = text("""
        INSERT INTO pipeline_runs (run_id, started_at, status, source_file)
        VALUES (:run_id, :started_at, 'running', :source_file)
        ON CONFLICT (run_id) DO UPDATE SET
            status='running', started_at=EXCLUDED.started_at
    """)
    with engine.begin() as conn:
        conn.execute(sql, {
            "run_id": run_id,
            "started_at": datetime.now(),
            "source_file": source_file,
        })


def finish_run(engine, run_id: str, accepted: int, rejected: int,
               total: int, status: str = "success",
               error: str | None = None) -> None:
    now = datetime.now()
    sql = text("""
        UPDATE pipeline_runs
        SET finished_at=:finished_at,
            status=:status,
            total_records=:total,
            accepted_records=:accepted,
            rejected_records=:rejected,
            error_message=:error,
            run_duration_secs=EXTRACT(EPOCH FROM (:finished_at - started_at))
        WHERE run_id=:run_id
    """)
    with engine.begin() as conn:
        conn.execute(sql, {
            "run_id": run_id,
            "finished_at": now,
            "status": status,
            "total": total,
            "accepted": accepted,
            "rejected": rejected,
            "error": error,
        })


# ─────────────────────────────────────────────────────────────────────────────
# UPSERT LOADERS
# ─────────────────────────────────────────────────────────────────────────────

def upsert_customers(engine, records: list[dict]) -> int:
    """Upsert customer records. Returns count of rows processed."""
    if not records:
        return 0

    sql = text("""
        INSERT INTO customers
            (id, customer_code, name, company, phone, alt_phone, email,
             gst_number, address, notes, created_at)
        VALUES
            (:id, :customer_code, :name, :company, :phone, :alt_phone, :email,
             :gst_number, :address, :notes, :created_at)
        ON CONFLICT (id) DO UPDATE SET
            customer_code = EXCLUDED.customer_code,
            name          = EXCLUDED.name,
            company       = EXCLUDED.company,
            phone         = EXCLUDED.phone,
            alt_phone     = EXCLUDED.alt_phone,
            email         = EXCLUDED.email,
            gst_number    = EXCLUDED.gst_number,
            address       = EXCLUDED.address,
            notes         = EXCLUDED.notes
    """)

    count = 0
    with engine.begin() as conn:
        for batch in _chunk(records, 500):
            conn.execute(sql, batch)
            count += len(batch)
    log.info(f"Upserted {count} customers.")
    return count


def upsert_jobs(engine, records: list[dict]) -> int:
    """Upsert job card records. Returns count of rows processed."""
    if not records:
        return 0

    sql = text("""
        INSERT INTO job_cards (
            id, job_no, customer_id, customer_name, company, phone,
            job_type, product_name, description, quantity,
            paper_size, paper_gsm, paper_type,
            print_type, print_sides, print_color_mode,
            print_lamination, print_binding, print_cutting, print_finishing,
            special_instructions, assigned_to, machine_used, priority,
            job_date, expected_delivery_date, actual_completion_date,
            status, estimated_cost, selling_price,
            advance_paid, balance_amount, payment_status,
            sheets_used, waste_sheets, rework_required, rework_quantity,
            is_on_time, will_delay_flag, lead_days, complexity_score,
            remarks, is_draft, is_synthetic, created_at, updated_at
        )
        VALUES (
            :id, :job_no, :customer_id, :customer_name, :company, :phone,
            :job_type, :product_name, :description, :quantity,
            :paper_size, :paper_gsm, :paper_type,
            :print_type, :print_sides, :print_color_mode,
            :print_lamination, :print_binding, :print_cutting, :print_finishing,
            :special_instructions, :assigned_to, :machine_used, :priority,
            :job_date, :expected_delivery_date, :actual_completion_date,
            :status, :estimated_cost, :selling_price,
            :advance_paid, :balance_amount, :payment_status,
            :sheets_used, :waste_sheets, :rework_required, :rework_quantity,
            :is_on_time, :will_delay_flag, :lead_days, :complexity_score,
            :remarks, :is_draft, :is_synthetic, :created_at, :updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            status              = EXCLUDED.status,
            selling_price       = EXCLUDED.selling_price,
            advance_paid        = EXCLUDED.advance_paid,
            balance_amount      = EXCLUDED.balance_amount,
            payment_status      = EXCLUDED.payment_status,
            actual_completion_date = EXCLUDED.actual_completion_date,
            is_on_time          = EXCLUDED.is_on_time,
            sheets_used         = EXCLUDED.sheets_used,
            waste_sheets        = EXCLUDED.waste_sheets,
            rework_required     = EXCLUDED.rework_required,
            rework_quantity     = EXCLUDED.rework_quantity,
            updated_at          = EXCLUDED.updated_at
    """)

    count = 0
    with engine.begin() as conn:
        for batch in _chunk(records, 200):
            conn.execute(sql, batch)
            count += len(batch)
    log.info(f"Upserted {count} job cards.")
    return count


def upsert_timeline_events(engine, records: list[dict]) -> int:
    if not records:
        return 0

    sql = text("""
        INSERT INTO job_card_timeline (id, job_card_id, status, timestamp, note, updated_by)
        VALUES (:id, :job_card_id, :status, :timestamp, :note, :updated_by)
        ON CONFLICT (id) DO UPDATE SET
            status     = EXCLUDED.status,
            timestamp  = EXCLUDED.timestamp,
            note       = EXCLUDED.note,
            updated_by = EXCLUDED.updated_by
    """)

    count = 0
    with engine.begin() as conn:
        for batch in _chunk(records, 500):
            conn.execute(sql, batch)
            count += len(batch)
    log.info(f"Upserted {count} timeline events.")
    return count


def upsert_activity_logs(engine, records: list[dict]) -> int:
    if not records:
        return 0

    sql = text("""
        INSERT INTO activity_logs (id, action, details, timestamp, entity_id, entity_type)
        VALUES (:id, :action, :details, :timestamp, :entity_id, :entity_type)
        ON CONFLICT (id) DO NOTHING
    """)

    count = 0
    with engine.begin() as conn:
        for batch in _chunk(records, 500):
            conn.execute(sql, batch)
            count += len(batch)
    log.info(f"Upserted {count} activity logs.")
    return count


def quarantine_records(engine, run_id: str, records: list[dict]) -> int:
    """Write rejected records to the quarantine table."""
    if not records:
        return 0

    import json
    sql = text("""
        INSERT INTO quarantine_records
            (run_id, source_row_index, raw_data, rejection_reasons,
             rejection_rule, quarantined_at)
        VALUES
            (:run_id, :source_row_index, :raw_data, :rejection_reasons,
             :rejection_rule, :quarantined_at)
    """)

    rows = []
    for r in records:
        raw_copy = {k: v for k, v in r.items()
                    if k not in ("rejection_reasons", "rejection_rule", "source_row_index")}
        rows.append({
            "run_id": run_id,
            "source_row_index": r.get("source_row_index", -1),
            "raw_data": json.dumps(raw_copy, default=str),
            "rejection_reasons": r.get("rejection_reasons", "unknown"),
            "rejection_rule": r.get("rejection_rule", "unknown"),
            "quarantined_at": datetime.now(),
        })

    with engine.begin() as conn:
        for batch in _chunk(rows, 500):
            conn.execute(sql, batch)

    log.info(f"Quarantined {len(rows)} rejected records.")
    return len(rows)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _chunk(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]
