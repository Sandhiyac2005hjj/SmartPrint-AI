package com.saigraphics.jobcard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_card_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCardFile {

    @Id
    private String id;

    @Column(name = "job_card_id", nullable = false)
    private String jobCardId;

    @Column(nullable = false)
    private String name;

    @Column(name = "file_size", nullable = false)
    private Long size;

    @Column(nullable = false)
    private String type;

    @Column(name = "file_url", columnDefinition = "TEXT", nullable = false)
    private String fileUrl;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "file-" + System.currentTimeMillis();
        }
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
    }
}
