package com.saigraphics.jobcard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_card_timeline")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineEvent {

    @Id
    private String id;

    @Column(name = "job_card_id", nullable = false)
    private String jobCardId;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "updated_by", nullable = false)
    private String updatedBy;
}
