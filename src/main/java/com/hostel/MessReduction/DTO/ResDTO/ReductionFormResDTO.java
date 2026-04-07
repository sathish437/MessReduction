package com.hostel.MessReduction.DTO.ResDTO;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.StudentDetails;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Time;
import java.time.LocalDate;
import java.util.Date;

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

}
