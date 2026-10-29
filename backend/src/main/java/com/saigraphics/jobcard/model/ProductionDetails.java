package com.saigraphics.jobcard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionDetails {

    @Column(name = "assigned_to")
    private String assignedTo;

    @Column(name = "machine_used")
    private String machineUsed;

    @Column(name = "priority")
    private String priority;
}
