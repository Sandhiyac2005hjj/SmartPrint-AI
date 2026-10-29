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
public class PrintDetails {

    @Column(name = "print_type")
    private String printType;

    @Column(name = "print_sides")
    private String sides;

    @Column(name = "print_color_mode")
    private String colorMode;

    @Column(name = "print_lamination")
    private String lamination;

    @Column(name = "print_binding")
    private String binding;

    @Column(name = "print_cutting")
    private String cutting;

    @Column(name = "print_finishing")
    private String finishing;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;
}
