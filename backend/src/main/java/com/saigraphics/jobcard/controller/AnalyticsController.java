package com.saigraphics.jobcard.controller;

import com.saigraphics.jobcard.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PrintPulse Analytics REST Controller
 * Exposes business intelligence data from PostgreSQL analytics views.
 * All endpoints return pre-aggregated data suitable for dashboard widgets.
 *
 * Base URL: /api/analytics
 * CORS: open (same as existing controllers)
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics/kpi
     * Single-row KPI summary for dashboard cards.
     * Includes: total_orders, total_revenue, on_time_rate_pct, gross_margin_pct, etc.
     */
    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpiSummary() {
        return ResponseEntity.ok(analyticsService.getKpiSummary());
    }

    /**
     * GET /api/analytics/revenue?granularity=daily|weekly|monthly
     * Revenue and order counts aggregated by time bucket.
     * Default granularity: daily.
     */
    @GetMapping("/revenue")
    public ResponseEntity<List<Map<String, Object>>> getRevenue(
            @RequestParam(defaultValue = "daily") String granularity) {
        return ResponseEntity.ok(analyticsService.getRevenueOverTime(granularity));
    }

    /**
     * GET /api/analytics/revenue-by-type
     * Revenue, order count, and delivery rate broken down by job type.
     */
    @GetMapping("/revenue-by-type")
    public ResponseEntity<List<Map<String, Object>>> getRevenueByJobType() {
        return ResponseEntity.ok(analyticsService.getRevenueByJobType());
    }

    /**
     * GET /api/analytics/order-volume?granularity=daily|weekly|monthly
     * Order counts by time bucket.
     */
    @GetMapping("/order-volume")
    public ResponseEntity<List<Map<String, Object>>> getOrderVolume(
            @RequestParam(defaultValue = "monthly") String granularity) {
        return ResponseEntity.ok(analyticsService.getOrderVolume(granularity));
    }

    /**
     * GET /api/analytics/status-summary
     * Count of jobs per status with percentage breakdown.
     */
    @GetMapping("/status-summary")
    public ResponseEntity<List<Map<String, Object>>> getStatusSummary() {
        return ResponseEntity.ok(analyticsService.getStatusSummary());
    }

    /**
     * GET /api/analytics/on-time-delivery
     * Overall on-time delivery rate and average lead days.
     */
    @GetMapping("/on-time-delivery")
    public ResponseEntity<Map<String, Object>> getOnTimeDelivery() {
        return ResponseEntity.ok(analyticsService.getOnTimeDelivery());
    }

    /**
     * GET /api/analytics/on-time-by-type
     * On-time delivery rate broken down by job type.
     */
    @GetMapping("/on-time-by-type")
    public ResponseEntity<List<Map<String, Object>>> getOnTimeByType() {
        return ResponseEntity.ok(analyticsService.getOnTimeByType());
    }

    /**
     * GET /api/analytics/overdue-jobs
     * Jobs that are past their expected delivery date and not yet delivered.
     */
    @GetMapping("/overdue-jobs")
    public ResponseEntity<List<Map<String, Object>>> getOverdueJobs() {
        return ResponseEntity.ok(analyticsService.getOverdueJobs());
    }

    /**
     * GET /api/analytics/repeat-customers
     * Customers with more than 1 order, sorted by lifetime value.
     */
    @GetMapping("/repeat-customers")
    public ResponseEntity<List<Map<String, Object>>> getRepeatCustomers() {
        return ResponseEntity.ok(analyticsService.getRepeatCustomers());
    }

    /**
     * GET /api/analytics/cost-margin
     * Estimated vs actual selling price and gross margin % by job type.
     */
    @GetMapping("/cost-margin")
    public ResponseEntity<List<Map<String, Object>>> getCostMargin() {
        return ResponseEntity.ok(analyticsService.getCostMargin());
    }

    /**
     * GET /api/analytics/waste-rework
     * Waste sheets and rework rate by job type.
     */
    @GetMapping("/waste-rework")
    public ResponseEntity<List<Map<String, Object>>> getWasteRework() {
        return ResponseEntity.ok(analyticsService.getWasteRework());
    }

    /**
     * GET /api/analytics/pipeline-runs
     * ETL pipeline execution history with status, duration, acceptance rate.
     */
    @GetMapping("/pipeline-runs")
    public ResponseEntity<List<Map<String, Object>>> getPipelineRuns() {
        return ResponseEntity.ok(analyticsService.getPipelineRuns());
    }

    /**
     * GET /api/analytics/data-quality
     * Overall data quality metrics: acceptance rate, error rate, quarantine counts.
     */
    @GetMapping("/data-quality")
    public ResponseEntity<Map<String, Object>> getDataQuality() {
        return ResponseEntity.ok(analyticsService.getDataQuality());
    }

    /**
     * GET /api/analytics/quarantine-by-rule
     * Breakdown of rejected records by validation rule.
     */
    @GetMapping("/quarantine-by-rule")
    public ResponseEntity<List<Map<String, Object>>> getQuarantineByRule() {
        return ResponseEntity.ok(analyticsService.getQuarantineByRule());
    }

    /**
     * GET /api/analytics/avg-completion-time
     * Average completion time by job type and priority.
     */
    @GetMapping("/avg-completion-time")
    public ResponseEntity<List<Map<String, Object>>> getAvgCompletionTime() {
        return ResponseEntity.ok(analyticsService.getAvgCompletionTime());
    }
}
