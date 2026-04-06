package com.hostel.MessReduction.DTO.ReqDTO;

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

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReductionFormReqDTO {
    @NotNull
    @Min(1)
    @Max(4)
    private Integer year;
    @NotNull
    private Long roomNo;
    @NotNull
    private LocalDate fromDate;
    @NotNull
    private LocalDate toDate;
    @NotNull
    private LocalDate presentDate;
}
