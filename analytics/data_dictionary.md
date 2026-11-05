# PrintPulse Analytics — Data Dictionary

> **⚠️ ALL SYNTHETIC DATA DISCLAIMER**  
> Every record in the `synthetic_*` tables and CSV files was generated programmatically using the Faker library with `random.seed(42)`. Names, companies, addresses, phone numbers, GST numbers, and all financial figures are entirely fictitious. This dataset is for portfolio and demonstration purposes only. It must not be presented as real business data.

---

## Table of Contents
1. [synthetic_customers](#1-synthetic_customers)
2. [synthetic_jobs_clean](#2-synthetic_jobs_clean)
3. [synthetic_jobs_dirty](#3-synthetic_jobs_dirty)
4. [synthetic_timeline_events](#4-synthetic_timeline_events)
5. [synthetic_activity_logs](#5-synthetic_activity_logs)
6. [pipeline_runs](#6-pipeline_runs)
7. [quarantine_records](#7-quarantine_records)
8. [Analytics Views](#8-analytics-views)

---

## 1. `synthetic_customers`

Source: `output/synthetic_customers.csv`  
Loaded into: `customers` table (PostgreSQL)  
Primary key: `id`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | VARCHAR | No | Synthetic unique ID: `syn-cust-NNNN` |
| `customer_code` | VARCHAR | No | Human-readable code: `CUST-NNNN` |
| `name` | VARCHAR | No | Full name of contact person (synthetic) |
| `company` | VARCHAR | No | Company / business name (synthetic) |
| `phone` | VARCHAR | No | Indian mobile number in format `+91 XXXXXXXXXX` |
| `alt_phone` | VARCHAR | Yes | Secondary phone (35% populated) |
| `email` | VARCHAR | Yes | Email derived from name + company (80% populated) |
| `gst_number` | VARCHAR | Yes | 15-character GST format (60% populated) |
| `address` | VARCHAR | No | Chennai area address with PIN code |
| `notes` | TEXT | Yes | Free-text notes (50% populated) |
| `created_at` | TIMESTAMP | No | Account creation timestamp (within first 60 days of dataset) |
| `is_synthetic` | BOOLEAN | No | Always `true` — flags synthetic records |

**Business meaning:** Each row represents one customer who placed print orders with Sai Graphics. A customer can have multiple job cards. Customers are de-duplicated by `id`.

---

## 2. `synthetic_jobs_clean`

Source: `output/synthetic_jobs_clean.csv`  
Loaded into: `job_cards` table (PostgreSQL)  
Primary key: `id`  
Foreign key: `customer_id → customers.id`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | VARCHAR | No | Synthetic job ID: `syn-jc-NNNNN` |
| `job_no` | VARCHAR | No | Unique job number: `JC-SYN-NNNN` |
| `customer_id` | VARCHAR | No | FK to `customers.id` |
| `customer_name` | VARCHAR | No | Denormalized customer name (for fast display) |
| `company` | VARCHAR | No | Denormalized company name |
| `phone` | VARCHAR | No | Denormalized phone |
| `job_type` | VARCHAR | No | Category of print job (see Job Types below) |
| `product_name` | VARCHAR | No | Human-readable product description |
| `description` | TEXT | Yes | Free-text order description |
| `quantity` | INTEGER | No | Number of units ordered (≥1) |
| `paper_size` | VARCHAR | Yes | Physical dimensions (e.g., A4, 90mm x 54mm) |
| `paper_gsm` | VARCHAR | Yes | Paper weight (e.g., 300 GSM) |
| `paper_type` | VARCHAR | Yes | Paper stock name (e.g., Gloss Art Paper) |
| `print_type` | VARCHAR | Yes | Printing method (Digital, Offset, Wide Format, etc.) |
| `print_sides` | VARCHAR | Yes | Single Side or Double Side |
| `print_color_mode` | VARCHAR | Yes | Color space / mode (CMYK, Black & White, etc.) |
| `print_lamination` | VARCHAR | Yes | Lamination type (None, Gloss, Matt, Velvet, etc.) |
| `print_binding` | VARCHAR | Yes | Binding method (None, Spiral, Perfect Bind, etc.) |
| `print_cutting` | VARCHAR | Yes | Cutting style (Standard, Rounded Corners, Die Cut) |
| `print_finishing` | VARCHAR | Yes | Finishing process (None, Spot UV, Embossing, etc.) |
| `special_instructions` | TEXT | Yes | Customer-specific instructions (40% populated) |
| `assigned_to` | VARCHAR | Yes | Assigned operator: `Name (Role)` |
| `machine_used` | VARCHAR | Yes | Production machine name |
| `priority` | VARCHAR | No | Low / Medium / High / Urgent (weighted: 10/50/30/10%) |
| `job_date` | DATE | No | Date the order was received |
| `expected_delivery_date` | DATE | No | Promised delivery date (computed from complexity model) |
| `actual_completion_date` | DATE | Yes | Actual date delivered (only for Delivered status) |
| `status` | VARCHAR | No | Current status (see Job Statuses below) |
| `estimated_cost` | NUMERIC(12,2) | No | Internal cost estimate in INR |
| `selling_price` | NUMERIC(12,2) | No | Quoted price to customer in INR |
| `advance_paid` | NUMERIC(12,2) | No | Amount collected so far (≥0) |
| `balance_amount` | NUMERIC(12,2) | No | Remaining balance = selling_price − advance_paid |
| `payment_status` | VARCHAR | No | Pending / Partial / Paid |
| `sheets_used` | INTEGER | Yes | Total paper sheets consumed (including waste) |
| `waste_sheets` | INTEGER | Yes | Sheets wasted during production |
| `rework_required` | BOOLEAN | Yes | Whether rework was needed (8% probability) |
| `rework_quantity` | INTEGER | Yes | Units requiring rework (0 if no rework) |
| `is_on_time` | BOOLEAN | Yes | TRUE if actual_completion_date ≤ expected_delivery_date (only for Delivered) |
| `will_delay_flag` | BOOLEAN | Yes | Synthetic ground-truth label for ML (was delay predicted at order time) |
| `lead_days` | INTEGER | No | Promised lead time in days (complexity model output) |
| `complexity_score` | INTEGER | No | 1–5 integer representing job complexity |
| `remarks` | TEXT | Yes | Internal remarks (30% populated) |
| `is_draft` | BOOLEAN | No | Always FALSE for clean records |
| `is_synthetic` | BOOLEAN | No | Always TRUE — data quality flag |
| `created_at` | TIMESTAMP | No | Record creation timestamp |
| `updated_at` | TIMESTAMP | No | Last modification timestamp |

### Job Types & Complexity Scores

| Job Type | Complexity (1–5) | Typical Lead Days |
|----------|-----------------|-------------------|
| Visiting Card | 1 | 1–3 |
| Sticker | 1 | 1–3 |
| Letterhead | 1 | 1–3 |
| Envelope | 1 | 1–3 |
| Label | 1 | 1–3 |
| Flex | 2 | 2–5 |
| Poster | 2 | 2–5 |
| Standee | 2 | 2–5 |
| Bill Book | 2 | 2–5 |
| Brochure | 3 | 4–8 |
| Invitation | 3 | 4–8 |
| Carry Bag | 3 | 4–8 |
| Offset | 4 | 6–10 |
| Catalogue | 5 | 8–14 |
| Packaging Box | 5 | 8–14 |

### Job Statuses (lifecycle order)

```
Pending → Designing → Printing → Finishing → Ready → Delivered
                                                          ↑
                                  Cancelled (from any stage)
```

### Delay Probability Model

P(delay) = 0.05 + (complexity × 0.04) + qty_factor + lead_factor + priority_factor

This model is intentionally transparent so the ML task is learnable but non-trivial.

---

## 3. `synthetic_jobs_dirty`

Source: `output/synthetic_jobs_dirty.csv`  
**Not loaded into production tables.** Used to test the validation pipeline only.  
After pipeline processing, rejected records appear in `quarantine_records`.

| Column | Additional Detail |
|--------|-------------------|
| All columns from `synthetic_jobs_clean` | Same schema |
| `corruption_type` | Label describing the injected error (see below) |

### Corruption Types

| Corruption Type | Description | Expected Validator |
|----------------|-------------|-------------------|
| `missing_customer_id` | `customer_id` is empty string | null-check |
| `invalid_quantity` | `quantity` ≤ 0 (negative or zero) | range-check |
| `invalid_date_range` | `expected_delivery_date` < `job_date` | date-consistency |
| `missing_job_type` | `job_type` is empty string | required-field |
| `impossible_price` | `selling_price` < `estimated_cost` | business-rule |
| `duplicate_job_no` | `job_no` repeated across records | uniqueness-check |
| `null_status` | `status` is None | null-check |
| `future_created_at` | `created_at` is 1 year in the future | temporal-check |
| `blank_customer_name` | `customer_name` is empty string | required-field |
| `invalid_payment_status` | `payment_status` = `"UNKNOWN_STATUS"` | enum-check |

---

## 4. `synthetic_timeline_events`

Source: `output/synthetic_timeline_events.csv`  
Loaded into: `job_card_timeline` table (PostgreSQL)  
Primary key: `id`  
Foreign key: `job_card_id → job_cards.id`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | VARCHAR | No | Unique event ID: `t-{hex}` |
| `job_card_id` | VARCHAR | No | FK to `job_cards.id` |
| `status` | VARCHAR | No | Status at the time of this event |
| `timestamp` | TIMESTAMP | No | When the status transition occurred |
| `note` | TEXT | Yes | Human-readable explanation |
| `updated_by` | VARCHAR | No | Operator who made the change |

**Business meaning:** Each row records one status transition for a job card. The sequence of events for a single job forms its production timeline. Used to compute actual completion time and on-time delivery metrics.

---

## 5. `synthetic_activity_logs`

Source: `output/synthetic_activity_logs.csv`  
Loaded into: `activity_logs` table (PostgreSQL)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | VARCHAR | No | Unique log ID: `log-{hex}` |
| `action` | VARCHAR | No | Action label (e.g., "Job Card Created") |
| `details` | TEXT | No | Human-readable detail string |
| `timestamp` | TIMESTAMP | No | When the action occurred |
| `entity_id` | VARCHAR | Yes | FK to related entity (job_card ID) |
| `entity_type` | VARCHAR | Yes | Entity type string (e.g., "JobCard") |

---

## 6. `pipeline_runs`

Created by the ETL pipeline. Stored in PostgreSQL.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | No | Auto-incrementing run ID |
| `run_id` | VARCHAR | No | UUID for this pipeline run |
| `started_at` | TIMESTAMP | No | Pipeline start time |
| `finished_at` | TIMESTAMP | Yes | Pipeline finish time (NULL if running) |
| `status` | VARCHAR | No | running / success / failed |
| `source_file` | VARCHAR | No | CSV filename processed |
| `total_records` | INTEGER | No | Records read from source |
| `accepted_records` | INTEGER | No | Records loaded to DB |
| `rejected_records` | INTEGER | No | Records sent to quarantine |
| `error_message` | TEXT | Yes | Error detail (if status = failed) |
| `run_duration_secs` | FLOAT | Yes | Wall-clock duration |

---

## 7. `quarantine_records`

Created by the ETL pipeline. Rejected records with rejection reasons.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | No | Auto-incrementing ID |
| `run_id` | VARCHAR | No | FK to `pipeline_runs.run_id` |
| `source_row_index` | INTEGER | No | Row number in source CSV |
| `raw_data` | JSONB | No | Original record as JSON |
| `rejection_reason` | TEXT | No | Human-readable reason for rejection |
| `rejection_rule` | VARCHAR | No | Rule name that failed (e.g., `null_check.customer_id`) |
| `quarantined_at` | TIMESTAMP | No | Timestamp of quarantine |

---

## 8. Analytics Views

These PostgreSQL views are created by `analytics/sql/analytics_views.sql` and queried by the Spring Boot analytics API.

| View Name | Description |
|-----------|-------------|
| `v_revenue_over_time` | Daily/weekly/monthly revenue from delivered + pending jobs |
| `v_revenue_by_job_type` | Total and average revenue per job type |
| `v_order_volume` | Order count by day, week, month |
| `v_job_status_summary` | Count of jobs per status |
| `v_on_time_delivery` | Overall on-time delivery rate and breakdown |
| `v_avg_completion_time` | Average lead days by job type and priority |
| `v_overdue_jobs` | Jobs past expected delivery with delay duration |
| `v_repeat_customers` | Customers with more than 1 order |
| `v_cost_margin` | Estimated vs actual cost, gross margin % |
| `v_waste_rework` | Waste sheets and rework rate by job type |
| `v_pipeline_runs` | Pipeline execution history summary |
| `v_data_quality` | Error rate, quarantine count, acceptance rate |

### Key Metric Definitions

| Metric | Formula | Caveat |
|--------|---------|--------|
| **Revenue** | SUM(selling_price) for non-Cancelled jobs | Includes unpaid balance; not cash collected |
| **On-Time Rate** | COUNT(is_on_time=TRUE) / COUNT(Delivered jobs) × 100 | Only computable for Delivered status |
| **Gross Margin** | (selling_price − estimated_cost) / selling_price × 100 | Estimated cost only; real COGS not tracked |
| **Waste Rate** | SUM(waste_sheets) / SUM(sheets_used) × 100 | Synthetic proxy; not actual production measurement |
| **Pipeline Success Rate** | accepted / total × 100 per run | Based on validation rules, not business completeness |

---

## Appendix — Column Naming Conventions

| Convention | Example | Where Used |
|------------|---------|------------|
| Snake_case | `customer_id` | All database columns |
| `syn-` prefix in IDs | `syn-jc-00001` | Synthetic records (easy to filter/delete) |
| `is_` boolean prefix | `is_on_time`, `is_synthetic` | Boolean fields |
| `_at` timestamp suffix | `created_at`, `quarantined_at` | All timestamp fields |
| `_date` date suffix | `job_date`, `expected_delivery_date` | DATE (no time) fields |
