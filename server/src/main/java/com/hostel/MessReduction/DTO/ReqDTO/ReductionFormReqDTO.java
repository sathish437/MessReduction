package com.hostel.MessReduction.DTO.ReqDTO;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

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
    @Positive
    private Long roomNo;
    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaveDate;
    @NotNull
    @Schema(type = "string", example = "10:10")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime leaveTime;
    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate arrivalDate;
    @NotNull
    @Schema(type = "string", example = "10:10")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime arrivalTime;
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate toDate;
    @NotBlank
    private String reason;
    private String additionalRemarks;

}
