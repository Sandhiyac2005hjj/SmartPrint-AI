"""
PrintPulse Analytics — Pipeline Orchestrator
=============================================
Main entry point for the ETL pipeline. Runs all stages in sequence:
  1. Read → 2. Validate → 3. Transform → 4. Load → 5. Log → 6. Summarize

Usage:
    python run_pipeline.py [--db-url URL] [--data-dir DIR] [--dry-run]

The pipeline is idempotent — re-running it with the same source files
will upsert (not duplicate) records.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

# ── Add parent dir to path so we can import siblings ──────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.validate import validate_jobs_batch, validate_customers_batch
from pipeline.transform import (
    transform_customers, transform_jobs,
    transform_timeline_events, transform_activity_logs,
)
from pipeline.load import (
    get_engine, bootstrap_schema,
    start_run, finish_run,
    upsert_customers, upsert_jobs,
    upsert_timeline_events, upsert_activity_logs,
    quarantine_records as quarantine_loader,
)

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("pipeline.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("printpulse.pipeline")


# ─────────────────────────────────────────────────────────────────────────────
# CSV READER
# ─────────────────────────────────────────────────────────────────────────────

def read_csv(filepath: Path) -> list[dict]:
    if not filepath.exists():
        log.warning(f"File not found: {filepath}")
        return []
    with open(filepath, encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ─────────────────────────────────────────────────────────────────────────────
# PIPELINE STAGES
# ─────────────────────────────────────────────────────────────────────────────

def stage_read(data_dir: Path) -> dict:
    log.info("═" * 55)
    log.info("STAGE 1 — READ SOURCE DATA")
    log.info("═" * 55)

    customers    = read_csv(data_dir / "synthetic_customers.csv")
    clean_jobs   = read_csv(data_dir / "synthetic_jobs_clean.csv")
    dirty_jobs   = read_csv(data_dir / "synthetic_jobs_dirty.csv")
    timeline     = read_csv(data_dir / "synthetic_timeline_events.csv")
    logs         = read_csv(data_dir / "synthetic_activity_logs.csv")

    # Combine clean + dirty for validation demo
    all_jobs = clean_jobs + dirty_jobs

    log.info(f"  Customers read:          {len(customers):>6,}")
    log.info(f"  Clean job cards read:    {len(clean_jobs):>6,}")
    log.info(f"  Dirty job cards read:    {len(dirty_jobs):>6,}")
    log.info(f"  Timeline events read:    {len(timeline):>6,}")
    log.info(f"  Activity logs read:      {len(logs):>6,}")

    return {
        "customers": customers,
        "all_jobs": all_jobs,
        "clean_jobs": clean_jobs,
        "timeline": timeline,
        "logs": logs,
    }


def stage_validate(data: dict) -> dict:
    log.info("═" * 55)
    log.info("STAGE 2 — VALIDATE")
    log.info("═" * 55)

    # Validate customers
    valid_customers, invalid_customers = validate_customers_batch(
        data["customers"]
    )
    log.info(f"  Customers → valid: {len(valid_customers):,}  |  rejected: {len(invalid_customers):,}")

    # Validate jobs (against known-good customer IDs)
    valid_jobs, invalid_jobs = validate_jobs_batch(
        data["all_jobs"], valid_customers
    )
    log.info(f"  Jobs      → valid: {len(valid_jobs):,}  |  rejected: {len(invalid_jobs):,}")

    # Log rejection reasons summary
    if invalid_jobs:
        reason_counts: dict[str, int] = {}
        for r in invalid_jobs:
            rule = r.get("rejection_rule", "unknown")
            reason_counts[rule] = reason_counts.get(rule, 0) + 1
        log.info("  Rejection summary:")
        for rule, count in sorted(reason_counts.items(), key=lambda x: -x[1]):
            log.info(f"    {rule:<45} {count:>4,}")

    return {
        **data,
        "valid_customers":  valid_customers,
        "invalid_customers": invalid_customers,
        "valid_jobs":       valid_jobs,
        "invalid_jobs":     invalid_jobs,
    }


def stage_transform(data: dict) -> dict:
    log.info("═" * 55)
    log.info("STAGE 3 — TRANSFORM")
    log.info("═" * 55)

    t_customers = transform_customers(data["valid_customers"])
    t_jobs      = transform_jobs(data["valid_jobs"])
    t_timeline  = transform_timeline_events(data["timeline"])
    t_logs      = transform_activity_logs(data["logs"])

    log.info(f"  Transformed customers:       {len(t_customers):>6,}")
    log.info(f"  Transformed job cards:       {len(t_jobs):>6,}")
    log.info(f"  Transformed timeline events: {len(t_timeline):>6,}")
    log.info(f"  Transformed activity logs:   {len(t_logs):>6,}")

    return {
        **data,
        "t_customers": t_customers,
        "t_jobs":      t_jobs,
        "t_timeline":  t_timeline,
        "t_logs":      t_logs,
    }


def stage_load(engine, run_id: str, data: dict, dry_run: bool) -> dict:
    log.info("═" * 55)
    log.info("STAGE 4 — LOAD TO DATABASE" + (" [DRY RUN]" if dry_run else ""))
    log.info("═" * 55)

    if dry_run:
        log.info("  DRY RUN: skipping database writes.")
        return {
            **data,
            "loaded_customers": 0,
            "loaded_jobs": 0,
            "loaded_timeline": 0,
            "loaded_logs": 0,
            "quarantined": 0,
        }

    loaded_customers = upsert_customers(engine, data["t_customers"])
    loaded_jobs      = upsert_jobs(engine, data["t_jobs"])
    loaded_timeline  = upsert_timeline_events(engine, data["t_timeline"])
    loaded_logs      = upsert_activity_logs(engine, data["t_logs"])
    quarantined      = quarantine_loader(
        engine, run_id, data["invalid_jobs"] + data["invalid_customers"]
    )

    log.info(f"  Loaded customers:      {loaded_customers:>6,}")
    log.info(f"  Loaded job cards:      {loaded_jobs:>6,}")
    log.info(f"  Loaded timeline evts:  {loaded_timeline:>6,}")
    log.info(f"  Loaded activity logs:  {loaded_logs:>6,}")
    log.info(f"  Quarantined records:   {quarantined:>6,}")

    return {
        **data,
        "loaded_customers": loaded_customers,
        "loaded_jobs":      loaded_jobs,
        "loaded_timeline":  loaded_timeline,
        "loaded_logs":      loaded_logs,
        "quarantined":      quarantined,
    }


def stage_summarize(run_id: str, data: dict, started_at: datetime) -> None:
    log.info("═" * 55)
    log.info("STAGE 5 — RUN SUMMARY")
    log.info("═" * 55)

    duration = (datetime.now() - started_at).total_seconds()
    total_in  = len(data.get("all_jobs", [])) + len(data.get("customers", []))
    accepted  = data.get("loaded_jobs", 0) + data.get("loaded_customers", 0)
    rejected  = (len(data.get("invalid_jobs", [])) +
                 len(data.get("invalid_customers", [])))

    accept_rate = (accepted / total_in * 100) if total_in else 0
    reject_rate = (rejected / total_in * 100) if total_in else 0

    log.info(f"  Run ID:           {run_id}")
    log.info(f"  Duration:         {duration:.1f}s")
    log.info(f"  Total input:      {total_in:,}")
    log.info(f"  Accepted:         {accepted:,}  ({accept_rate:.1f}%)")
    log.info(f"  Rejected:         {rejected:,}  ({reject_rate:.1f}%)")

    # Write JSON summary to file
    summary = {
        "run_id": run_id,
        "started_at": started_at.isoformat(),
        "finished_at": datetime.now().isoformat(),
        "duration_secs": round(duration, 2),
        "total_input": total_in,
        "accepted": accepted,
        "rejected": rejected,
        "acceptance_rate_pct": round(accept_rate, 2),
        "rejection_rate_pct": round(reject_rate, 2),
    }
    out = Path("pipeline_run_summary.json")
    with open(out, "w") as f:
        json.dump(summary, f, indent=2)
    log.info(f"  Summary written:  {out.resolve()}")
    log.info("═" * 55)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def build_db_url(args) -> str:
    # Priority: --db-url arg → ENV var → default
    if args.db_url:
        return args.db_url
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    # Fallback to components
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    db   = os.environ.get("DB_NAME", "jobcard_db")
    user = os.environ.get("DB_USERNAME", "postgres")
    pwd  = os.environ.get("DB_PASSWORD", "postgres")
    return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{db}"


def main():
    parser = argparse.ArgumentParser(
        description="PrintPulse Analytics ETL Pipeline"
    )
    parser.add_argument("--db-url", help="SQLAlchemy database URL")
    parser.add_argument("--data-dir", default="../output",
                        help="Directory containing source CSV files")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate + transform only; skip database writes")
    args = parser.parse_args()

    run_id     = str(uuid.uuid4())
    started_at = datetime.now()

    log.info("╔═══════════════════════════════════════════════════╗")
    log.info("║  PrintPulse Analytics — ETL Pipeline              ║")
    log.info("║  ⚠  Synthetic data only — not real business data  ║")
    log.info("╚═══════════════════════════════════════════════════╝")
    log.info(f"Run ID: {run_id}")

    data_dir = Path(args.data_dir)
    db_url   = build_db_url(args)

    engine = None
    try:
        # Set up engine + schema
        if not args.dry_run:
            log.info(f"Connecting to: {db_url.split('@')[-1]}")  # hide credentials
            engine = get_engine(db_url)
            bootstrap_schema(engine)
            start_run(engine, run_id, str(data_dir))

        # Run pipeline stages
        data = stage_read(data_dir)
        data = stage_validate(data)
        data = stage_transform(data)
        data = stage_load(engine, run_id, data, args.dry_run)

        # Finish pipeline run record
        if not args.dry_run and engine:
            total = len(data.get("all_jobs", [])) + len(data.get("customers", []))
            accepted = data.get("loaded_jobs", 0) + data.get("loaded_customers", 0)
            rejected = (len(data.get("invalid_jobs", [])) +
                        len(data.get("invalid_customers", [])))
            finish_run(engine, run_id, accepted, rejected, total, "success")

        stage_summarize(run_id, data, started_at)
        log.info("✅ Pipeline completed successfully.")

    except KeyboardInterrupt:
        log.warning("Pipeline interrupted by user.")
        if engine and not args.dry_run:
            finish_run(engine, run_id, 0, 0, 0, "failed", "Interrupted")
        sys.exit(1)

    except Exception as exc:
        log.exception(f"Pipeline FAILED: {exc}")
        if engine and not args.dry_run:
            finish_run(engine, run_id, 0, 0, 0, "failed", str(exc))
        sys.exit(1)


if __name__ == "__main__":
    main()
