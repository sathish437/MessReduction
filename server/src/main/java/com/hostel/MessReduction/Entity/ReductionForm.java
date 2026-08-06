package com.hostel.MessReduction.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Timer;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reduction_form", indexes = {
        @Index(name = "idx_rf_status_active", columnList = "current_status, is_active"),
        @Index(name = "idx_rf_deputy_active", columnList = "assigned_deputy_warden, is_active"),
        @Index(name = "idx_rf_year_status_active", columnList = "year, current_status, is_active"),
        @Index(name = "idx_rf_student_active", columnList = "student_id, is_active"),
        @Index(name = "idx_rf_dates", columnList = "leave_date, arrival_date"),
        @Index(name = "idx_rf_submitted_at", columnList = "submitted_at")
})
public class ReductionForm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long formId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id",nullable = false)
    @JsonBackReference
    private StudentDetails studentDetails;
    @NotNull
    @Min(1)
    @Max(4)
    private Integer year;
    @Column(length = 6,nullable = false)
    @NotNull
    private Long roomNo;
    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaveDate;
    @NotNull
    @Schema(type = "string", example = "10:10:10")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime leaveTime;
    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate arrivalDate;
    @NotNull
    @Schema(type = "string", example = "10:10:10")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime arrivalTime;
    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate presentDate;
    @NotNull
    private Long totalHolidays;
    @NotBlank
    private String reason;
    @NotNull
    @Enumerated(EnumType.STRING)
    private FormStatus currentStatus;

    @Column(length = 255, nullable = true)
    private String assignedDeputyWarden;

    @Column(length = 1000)
    private String rejectReason;

    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate toDate;

    @Column(length = 1000)
    private String additionalRemarks;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int resubmissionCount = 0;

    @Enumerated(EnumType.STRING)
    private FormStatus rejectedStage;

    @Enumerated(EnumType.STRING)
    private FormStatus resumeStage;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean deletedByStudent = false;

    @Column
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime submittedAt;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean reminder30MinSent = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean reminder1HourSent = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean reminder3HourSent = false;



    // Repeating reminder/escalation tracking
    @Column
    private LocalDateTime lastReminderSentAt;

    @Column
    private LocalDateTime lastEscalationSentAt;

    @Column
    private LocalDateTime lastSummarySentAt;

    @OneToMany(mappedBy = "reductionForm", cascade = CascadeType.ALL, orphanRemoval = false)
    @JsonIgnore
    private List<ReductionFormHistory> history = new ArrayList<>();

    private boolean isActive = true;

}
