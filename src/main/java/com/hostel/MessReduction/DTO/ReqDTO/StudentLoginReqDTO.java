package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

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
    private Date dob;
}
