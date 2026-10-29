package com.saigraphics.jobcard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingDetails {

    @Column(name = "bill_no")
    private String billNo;

    @Column(name = "estimated_cost")
    private BigDecimal estimatedCost;

    @Column(name = "selling_price")
    private BigDecimal sellingPrice;

    @Column(name = "advance_paid")
    private BigDecimal advancePaid;

    @Column(name = "balance_amount")
    private BigDecimal balanceAmount;

    @Column(name = "payment_status")
    private String paymentStatus;
}
