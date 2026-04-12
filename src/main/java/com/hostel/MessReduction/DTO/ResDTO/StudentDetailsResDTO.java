package com.hostel.MessReduction.DTO.ResDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StudentDetailsResDTO {
    @NotNull
    private Long studentId;
    @NotBlank
    @Email
    private String emailId;
}
