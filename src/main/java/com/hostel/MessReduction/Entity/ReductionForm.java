package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.sql.Time;
import java.time.LocalDate;
import java.util.Date;
import java.util.Timer;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class ReductionForm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long formId;
    @ManyToOne(fetch = FetchType.LAZY)
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
    private Date leaveDate;
    @NotNull
    private Time leaveTime;
    @NotNull
    private Date arrivalDate;
    @NotNull
    private Time arrivalTime;
    @NotNull
    private Date presentDate;
    @NotNull
    private Long totalHolidays;
    @NotBlank
    private String reason;
    @NotNull
    @Enumerated(EnumType.STRING)
    private FormStatus currentStatus;
}
