package com.hostel.MessReduction.DTO.ReqDTO;

import com.fasterxml.jackson.annotation.JsonFormat;

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
    @NotBlank
    private String reason;
    private Boolean isEmergency;
}
