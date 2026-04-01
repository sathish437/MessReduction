package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class ReductionForm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long formId;
    @ManyToOne
    @JoinColumn(name = "student_id",nullable = false)
    private StudentDetails studentDetails;
    @NotNull
    @Min(1)
    @Max(4)
    private Integer year;
    @Column(length = 6,nullable = false)
    @NotNull
    private Long roomNo;

    @NotNull
    private LocalDate fromDate;
    @NotNull
    private LocalDate toDate;
    @NotNull
    private LocalDate presentDate;
    @NotBlank
    @Enumerated(EnumType.STRING)
    private FormStatus currentStatus;

}
