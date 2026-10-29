package com.saigraphics.jobcard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    private String id;

    @Column(name = "customer_code", unique = true, nullable = false)
    private String customerCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String phone;

    @Column(name = "alt_phone")
    private String altPhone;

    private String email;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String address;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "cust-" + System.currentTimeMillis();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
