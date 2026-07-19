package com.hostel.MessReduction.DTO.ResDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReductionFormResDTO {
    @NotNull
    private Long formId;
    @NotNull
    private Long studentId;
    @NotBlank
    private String name;
    @NotNull
    @Min(1)
    @Max(4)
    private Integer year;
    @NotNull
    private Department department;
    @NotNull
    private Long roomNo;
    @NotBlank
    private String assignedDeputyWarden;
    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaveDate;
    @NotNull
    private FormStatus currentStatus;
    private String rejectReason;
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
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate presentDate;
    @NotNull
    private Long totalHolidays;
    @NotBlank
    private String reason;
    
    private String registerNo;
    private Gender gender;
    private String rollNo;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedAt;
}
