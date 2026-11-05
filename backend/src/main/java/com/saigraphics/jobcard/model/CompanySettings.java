package com.saigraphics.jobcard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "company_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySettings {

    @Id
    @Builder.Default
    private Long id = 1L;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(name = "logo_url")
    private String logoUrl;

    private String phone;
    private String email;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String currency;

    @Column(name = "job_prefix")
    private String jobPrefix;

    @Column(columnDefinition = "TEXT")
    private String terms;
}
