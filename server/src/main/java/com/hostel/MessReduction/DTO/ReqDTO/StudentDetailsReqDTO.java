package com.hostel.MessReduction.DTO.ReqDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hostel.MessReduction.Entity.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
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
public class StudentDetailsReqDTO {
    @NotBlank
    private String name;

    @NotBlank
    private String registerNo;

    @NotBlank
    private String rollNo;

    @NotNull
    @Schema(type = "string", example = "2026-04-27")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dob;

    @NotBlank
    private String phoneNo;

    @Email
    @NotBlank
    private String emailId;

    @NotBlank
    private String department;

    @NotNull
    private Gender gender;
}
