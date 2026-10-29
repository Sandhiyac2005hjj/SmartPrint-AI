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
public class PaperDetails {

    @Column(name = "paper_size")
    private String size;

    @Column(name = "paper_gsm")
    private String gsm;

    @Column(name = "paper_type")
    private String paperType;
}
