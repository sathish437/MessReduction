package com.hostel.MessReduction.DTO.ReqDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StudentLoginReqDTO {
    @NotBlank
    @Email
    private String emailId;
    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dob;
}
