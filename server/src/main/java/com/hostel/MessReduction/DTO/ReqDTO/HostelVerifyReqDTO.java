package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HostelVerifyReqDTO {

    @NotBlank(message = "Roll Number is required")
    private String rollNo;

    @NotBlank(message = "Password is required")
    private String password;
}
