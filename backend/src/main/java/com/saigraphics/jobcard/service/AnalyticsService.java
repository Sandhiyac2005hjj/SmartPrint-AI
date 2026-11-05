package com.saigraphics.jobcard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * PrintPulse Analytics Service
 * Queries the analytics views created by analytics/sql/analytics_views.sql.
 * Uses JdbcTemplate with native SQL for maximum query flexibility.
 *
 * NOTE: All queries fall back to empty results if the analytics tables
 * (pipeline_runs, quarantine_records) do not yet exist. The pipeline
 * must have run at least once for full data to appear.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbc;

    // ─────────────────────────────────────────────────────────────────────────
    // KPI SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    public Map<String, Object> getKpiSummary() {
        try {
            String sql = "SELECT * FROM v_kpi_summary LIMIT 1";
            List<Map<String, Object>> rows = jdbc.queryForList(sql);
            return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
        } catch (Exception e) {
            log.warn("v_kpi_summary not available (pipeline may not have run yet): {}", e.getMessage());
            return fallbackKpi();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVENUE
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getRevenueOverTime(String granularity) {
        String dateBucket = switch (granularity.toLowerCase()) {
            case "weekly"  -> "week_start";
            case "monthly" -> "month_start";
            default        -> "day";
        };
        String sql = String.format(
            "SELECT %s AS date_bucket, order_count, total_revenue, " +
            "total_collected, total_outstanding, avg_order_value " +
            "FROM v_revenue_over_time " +
            "WHERE %s IS NOT NULL " +
            "GROUP BY date_bucket, order_count, total_revenue, " +
            "total_collected, total_outstanding, avg_order_value " +
            "ORDER BY date_bucket DESC LIMIT 90",
            dateBucket, dateBucket);
        return safeQuery(sql);
    }

    public List<Map<String, Object>> getRevenueByJobType() {
        return safeQuery("SELECT * FROM v_revenue_by_job_type");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ORDER VOLUME
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getOrderVolume(String granularity) {
        String dateBucket = switch (granularity.toLowerCase()) {
            case "weekly"  -> "week_start";
            case "monthly" -> "month_start";
            default        -> "day";
        };
        String sql = String.format(
            "SELECT %s AS date_bucket, " +
            "SUM(total_orders) AS total_orders, " +
            "SUM(active_orders) AS active_orders, " +
            "SUM(cancelled_orders) AS cancelled_orders " +
            "FROM v_order_volume " +
            "WHERE %s IS NOT NULL " +
            "GROUP BY date_bucket ORDER BY date_bucket DESC LIMIT 60",
            dateBucket, dateBucket);
        return safeQuery(sql);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getStatusSummary() {
        return safeQuery("SELECT * FROM v_job_status_summary");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ON-TIME DELIVERY
    // ─────────────────────────────────────────────────────────────────────────

    public Map<String, Object> getOnTimeDelivery() {
        List<Map<String, Object>> rows = safeQuery(
            "SELECT * FROM v_on_time_delivery LIMIT 1");
        return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
    }

    public List<Map<String, Object>> getOnTimeByType() {
        return safeQuery("SELECT * FROM v_on_time_by_type");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERDUE JOBS
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getOverdueJobs() {
        return safeQuery(
            "SELECT * FROM v_overdue_jobs LIMIT 100");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOMERS
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getRepeatCustomers() {
        return safeQuery(
            "SELECT * FROM v_repeat_customers LIMIT 50");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COST & MARGIN
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getCostMargin() {
        return safeQuery("SELECT * FROM v_cost_margin");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WASTE & REWORK
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getWasteRework() {
        return safeQuery("SELECT * FROM v_waste_rework");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PIPELINE MONITORING
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getPipelineRuns() {
        return safeQuery(
            "SELECT * FROM v_pipeline_runs LIMIT 50",
            "pipeline_runs");
    }

    public Map<String, Object> getDataQuality() {
        List<Map<String, Object>> rows = safeQuery(
            "SELECT * FROM v_data_quality LIMIT 1",
            "pipeline_runs");
        return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
    }

    public List<Map<String, Object>> getQuarantineByRule() {
        return safeQuery(
            "SELECT * FROM v_quarantine_by_rule",
            "quarantine_records");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPLETION TIME
    // ─────────────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getAvgCompletionTime() {
        return safeQuery("SELECT * FROM v_avg_completion_time");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private List<Map<String, Object>> safeQuery(String sql) {
        return safeQuery(sql, null);
    }

    private List<Map<String, Object>> safeQuery(String sql, String tableName) {
        try {
            return jdbc.queryForList(sql);
        } catch (Exception e) {
            String hint = tableName != null
                ? " (table '" + tableName + "' may not exist — run the pipeline first)"
                : "";
            log.warn("Analytics query failed{}: {}", hint, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Fallback KPI from live job_cards table when v_kpi_summary view
     * is not yet available (before pipeline runs analytics schema bootstrap).
     */
    private Map<String, Object> fallbackKpi() {
        try {
            String sql = """
                SELECT
                    COUNT(*) AS total_orders,
                    COUNT(DISTINCT customer_id) AS total_customers,
                    COALESCE(SUM(selling_price), 0) AS total_revenue,
                    COALESCE(SUM(advance_paid), 0) AS total_collected,
                    COALESCE(SUM(balance_amount), 0) AS total_outstanding,
                    SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS delivered_count,
                    SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
                    SUM(CASE WHEN status NOT IN ('Delivered','Cancelled') THEN 1 ELSE 0 END) AS active_count
                FROM job_cards
                """;
            List<Map<String, Object>> rows = jdbc.queryForList(sql);
            return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
        } catch (Exception ex) {
            log.error("Fallback KPI query also failed: {}", ex.getMessage());
            return Collections.emptyMap();
        }
    }
}
