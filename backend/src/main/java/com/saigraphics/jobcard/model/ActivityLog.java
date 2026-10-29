package com.saigraphics.jobcard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    private String id;

    @Column(nullable = false)
    private String action;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "entity_type")
    private String entityType;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "log-" + System.currentTimeMillis();
        }
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
