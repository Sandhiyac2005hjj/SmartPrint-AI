-- ============================================================================
-- PrintPulse Analytics — SQL Analytics Views
-- ============================================================================
-- Run this file once after the ETL pipeline has loaded synthetic data.
-- All views are safe to re-create (CREATE OR REPLACE).
-- Queries work against the existing Spring Boot schema extended with
-- analytics columns added by the pipeline loader.
--
-- ⚠ SYNTHETIC DATA NOTICE: These views query synthetic data generated
-- for portfolio demonstration only.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Revenue over time (daily, weekly, monthly buckets)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_revenue_over_time AS
SELECT
    job_date::DATE                                        AS day,
    DATE_TRUNC('week',  job_date::DATE)::DATE             AS week_start,
    DATE_TRUNC('month', job_date::DATE)::DATE             AS month_start,
    COUNT(*)                                              AS order_count,
    SUM(selling_price)                                    AS total_revenue,
    SUM(advance_paid)                                     AS total_collected,
    SUM(balance_amount)                                   AS total_outstanding,
    ROUND(AVG(selling_price)::NUMERIC, 2)                 AS avg_order_value
FROM job_cards
WHERE status <> 'Cancelled'
  AND job_date IS NOT NULL
  AND job_date <> ''
GROUP BY day, week_start, month_start
ORDER BY day;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Revenue by job type
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_revenue_by_job_type AS
SELECT
    job_type,
    COUNT(*)                                              AS order_count,
    SUM(selling_price)                                    AS total_revenue,
    ROUND(AVG(selling_price)::NUMERIC, 2)                 AS avg_revenue,
    ROUND(AVG(quantity)::NUMERIC, 1)                      AS avg_quantity,
    SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count,
    SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
    ROUND(
        100.0 * SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1
    )                                                     AS delivery_rate_pct
FROM job_cards
GROUP BY job_type
ORDER BY total_revenue DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Order volume by day / week / month
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_order_volume AS
SELECT
    job_date::DATE                                        AS day,
    DATE_TRUNC('week',  job_date::DATE)::DATE             AS week_start,
    DATE_TRUNC('month', job_date::DATE)::DATE             AS month_start,
    COUNT(*)                                              AS total_orders,
    SUM(CASE WHEN status <> 'Cancelled' THEN 1 ELSE 0 END) AS active_orders,
    SUM(CASE WHEN status = 'Cancelled'  THEN 1 ELSE 0 END) AS cancelled_orders
FROM job_cards
WHERE job_date IS NOT NULL
  AND job_date <> ''
GROUP BY day, week_start, month_start
ORDER BY day;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Job status distribution
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_job_status_summary AS
SELECT
    status,
    COUNT(*)                                              AS job_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)   AS pct_of_total,
    SUM(selling_price)                                    AS total_value,
    ROUND(AVG(selling_price)::NUMERIC, 2)                 AS avg_value
FROM job_cards
GROUP BY status
ORDER BY
    CASE status
        WHEN 'Pending'   THEN 1
        WHEN 'Designing' THEN 2
        WHEN 'Printing'  THEN 3
        WHEN 'Finishing' THEN 4
        WHEN 'Ready'     THEN 5
        WHEN 'Delivered' THEN 6
        WHEN 'Cancelled' THEN 7
        ELSE 8
    END;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. On-time delivery analysis
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_on_time_delivery AS
SELECT
    -- Overall
    COUNT(*)                                              AS total_delivered,
    SUM(CASE WHEN is_on_time = true  THEN 1 ELSE 0 END)  AS on_time_count,
    SUM(CASE WHEN is_on_time = false THEN 1 ELSE 0 END)  AS late_count,
    ROUND(
        100.0 * SUM(CASE WHEN is_on_time = true THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1
    )                                                     AS on_time_rate_pct,

    -- Breakdown by job type (aggregated across all)
    -- (use v_on_time_by_type for per-type breakdown)
    ROUND(AVG(lead_days)::NUMERIC, 1)                     AS avg_promised_lead_days,
    ROUND(AVG(
        CASE WHEN actual_completion_date IS NOT NULL
             AND actual_completion_date <> ''
             AND job_date IS NOT NULL
             AND job_date <> ''
        THEN (actual_completion_date::DATE - job_date::DATE)
        END
    )::NUMERIC, 1)                                        AS avg_actual_lead_days
FROM job_cards
WHERE status = 'Delivered';

-- Per job-type on-time breakdown
CREATE OR REPLACE VIEW v_on_time_by_type AS
SELECT
    job_type,
    COUNT(*)                                              AS delivered_count,
    SUM(CASE WHEN is_on_time = true  THEN 1 ELSE 0 END)  AS on_time_count,
    ROUND(
        100.0 * SUM(CASE WHEN is_on_time = true THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1
    )                                                     AS on_time_rate_pct
FROM job_cards
WHERE status = 'Delivered'
GROUP BY job_type
ORDER BY on_time_rate_pct DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Average job completion time
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_avg_completion_time AS
SELECT
    job_type,
    priority,
    COUNT(*)                                              AS job_count,
    ROUND(AVG(lead_days)::NUMERIC, 1)                    AS avg_promised_days,
    ROUND(AVG(
        CASE WHEN actual_completion_date IS NOT NULL
             AND actual_completion_date <> ''
             AND job_date IS NOT NULL
             AND job_date <> ''
        THEN (actual_completion_date::DATE - job_date::DATE)
        END
    )::NUMERIC, 1)                                       AS avg_actual_days
FROM job_cards
WHERE status = 'Delivered'
GROUP BY job_type, priority
ORDER BY job_type, priority;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Overdue jobs
--    A job is overdue if expected_delivery_date has passed and it is NOT
--    Delivered or Cancelled.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_overdue_jobs AS
SELECT
    id,
    job_no,
    customer_name,
    company,
    job_type,
    product_name,
    priority,
    status,
    job_date::DATE                                        AS job_date,
    expected_delivery_date::DATE                          AS promised_date,
    CURRENT_DATE                                          AS today,
    (CURRENT_DATE - expected_delivery_date::DATE)         AS days_overdue,
    selling_price,
    balance_amount,
    payment_status,
    assigned_to
FROM job_cards
WHERE status NOT IN ('Delivered', 'Cancelled')
  AND expected_delivery_date IS NOT NULL
  AND expected_delivery_date <> ''
  AND expected_delivery_date::DATE < CURRENT_DATE
ORDER BY days_overdue DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Repeat customers (customers with more than 1 order)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_repeat_customers AS
SELECT
    jc.customer_id,
    jc.customer_name,
    jc.company,
    COUNT(*)                                              AS total_orders,
    SUM(jc.selling_price)                                 AS lifetime_value,
    ROUND(AVG(jc.selling_price)::NUMERIC, 2)              AS avg_order_value,
    MIN(jc.job_date::DATE)                                AS first_order_date,
    MAX(jc.job_date::DATE)                                AS last_order_date,
    SUM(CASE WHEN jc.status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count,
    SUM(CASE WHEN jc.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count
FROM job_cards jc
WHERE jc.job_date IS NOT NULL
  AND jc.job_date <> ''
GROUP BY jc.customer_id, jc.customer_name, jc.company
HAVING COUNT(*) > 1
ORDER BY total_orders DESC, lifetime_value DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Estimated vs actual cost & profit margin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_cost_margin AS
SELECT
    job_type,
    COUNT(*)                                              AS order_count,
    ROUND(AVG(estimated_cost)::NUMERIC, 2)                AS avg_estimated_cost,
    ROUND(AVG(selling_price)::NUMERIC, 2)                 AS avg_selling_price,
    ROUND(SUM(selling_price) - SUM(estimated_cost), 2)    AS total_gross_profit,
    ROUND(
        100.0 * (SUM(selling_price) - SUM(estimated_cost))
        / NULLIF(SUM(selling_price), 0), 1
    )                                                     AS gross_margin_pct,
    ROUND(
        100.0 * (AVG(selling_price) - AVG(estimated_cost))
        / NULLIF(AVG(selling_price), 0), 1
    )                                                     AS avg_margin_pct
FROM job_cards
WHERE status <> 'Cancelled'
  AND estimated_cost > 0
  AND selling_price > 0
GROUP BY job_type
ORDER BY total_gross_profit DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Material waste and rework rate
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_waste_rework AS
SELECT
    job_type,
    COUNT(*)                                              AS job_count,
    SUM(sheets_used)                                      AS total_sheets_used,
    SUM(waste_sheets)                                     AS total_waste_sheets,
    ROUND(
        100.0 * SUM(waste_sheets) / NULLIF(SUM(sheets_used), 0), 2
    )                                                     AS waste_rate_pct,
    SUM(CASE WHEN rework_required = true THEN 1 ELSE 0 END) AS rework_jobs,
    ROUND(
        100.0 * SUM(CASE WHEN rework_required = true THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1
    )                                                     AS rework_rate_pct,
    SUM(rework_quantity)                                  AS total_rework_units
FROM job_cards
WHERE sheets_used IS NOT NULL
  AND status <> 'Cancelled'
GROUP BY job_type
ORDER BY waste_rate_pct DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Pipeline execution history
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_pipeline_runs AS
SELECT
    id,
    run_id,
    started_at,
    finished_at,
    status,
    source_file,
    total_records,
    accepted_records,
    rejected_records,
    ROUND(
        100.0 * accepted_records / NULLIF(total_records, 0), 1
    )                                                     AS acceptance_rate_pct,
    ROUND(run_duration_secs::NUMERIC, 2)                  AS duration_secs,
    error_message
FROM pipeline_runs
ORDER BY started_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Data quality dashboard
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_data_quality AS
SELECT
    -- Total records across all runs
    SUM(total_records)                                    AS total_records_processed,
    SUM(accepted_records)                                 AS total_accepted,
    SUM(rejected_records)                                 AS total_rejected,
    ROUND(
        100.0 * SUM(accepted_records)
        / NULLIF(SUM(total_records), 0), 1
    )                                                     AS overall_acceptance_rate_pct,
    ROUND(
        100.0 * SUM(rejected_records)
        / NULLIF(SUM(total_records), 0), 1
    )                                                     AS overall_error_rate_pct,
    COUNT(DISTINCT run_id)                                AS total_pipeline_runs,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)  AS successful_runs,
    SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END)  AS failed_runs,
    ROUND(
        100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1
    )                                                     AS pipeline_success_rate_pct
FROM pipeline_runs;

-- Per-rejection-rule breakdown from quarantine
CREATE OR REPLACE VIEW v_quarantine_by_rule AS
SELECT
    rejection_rule,
    COUNT(*)                                              AS rejection_count,
    MIN(quarantined_at)                                   AS first_seen,
    MAX(quarantined_at)                                   AS last_seen
FROM quarantine_records
GROUP BY rejection_rule
ORDER BY rejection_count DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. KPI Summary (single-row for dashboard cards)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_kpi_summary AS
SELECT
    COUNT(*)                                              AS total_orders,
    COUNT(DISTINCT customer_id)                           AS total_customers,
    SUM(selling_price)                                    AS total_revenue,
    SUM(advance_paid)                                     AS total_collected,
    SUM(balance_amount)                                   AS total_outstanding,
    SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count,
    SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
    SUM(CASE WHEN status NOT IN ('Delivered','Cancelled') THEN 1 ELSE 0 END)
                                                          AS active_count,
    ROUND(
        100.0 * SUM(CASE WHEN is_on_time = true THEN 1 ELSE 0 END)
        / NULLIF(SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END), 0), 1
    )                                                     AS on_time_rate_pct,
    ROUND(AVG(selling_price)::NUMERIC, 2)                 AS avg_order_value,
    ROUND(
        100.0 * (SUM(selling_price) - SUM(estimated_cost))
        / NULLIF(SUM(selling_price), 0), 1
    )                                                     AS gross_margin_pct,
    SUM(waste_sheets)                                     AS total_waste_sheets,
    SUM(CASE WHEN rework_required = true THEN 1 ELSE 0 END) AS rework_jobs_count
FROM job_cards
WHERE status <> 'Cancelled';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES for view performance
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_cards_actual_completion
    ON job_cards (actual_completion_date);

CREATE INDEX IF NOT EXISTS idx_job_cards_is_on_time
    ON job_cards (is_on_time)
    WHERE status = 'Delivered';

CREATE INDEX IF NOT EXISTS idx_job_cards_created_at
    ON job_cards (created_at);
