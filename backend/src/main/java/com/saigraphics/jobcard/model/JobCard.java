package com.saigraphics.jobcard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCard {

    @Id
    private String id;

    @Column(name = "job_no", unique = true, nullable = false)
    private String jobNo;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String phone;

    @Column(name = "job_type", nullable = false)
    private String jobType;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Embedded
    private PaperDetails paperDetails;

    @Embedded
    private PrintDetails printDetails;

    @Embedded
    private ProductionDetails production;

    @Column(name = "job_date", nullable = false)
    private String jobDate;

    @Column(name = "expected_delivery_date", nullable = false)
    private String expectedDeliveryDate;

    @Column(name = "predicted_completion_date")
    private String predictedCompletionDate;

    @Column(name = "predicted_days")
    private Integer predictedDays;

    @Column(nullable = false)
    private String status;

    @Embedded
    private BillingDetails billing;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "job_card_id")
    @Builder.Default
    private List<TimelineEvent> timeline = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "job_card_id")
    @Builder.Default
    private List<JobCardFile> files = new ArrayList<>();

    @Column(name = "is_draft")
    private Boolean isDraft = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "jc-" + System.currentTimeMillis();
        }
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
