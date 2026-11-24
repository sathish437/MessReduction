package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StudentLoginReqDTO {
    @NotBlank(message = "Register Number / Roll Number is required.")
    private String identifier;

    @NotBlank(message = "Password is required.")
    private String password;
}
