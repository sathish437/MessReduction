package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CompleteProfileReqDTO {

    @NotBlank(message = "Phone number is required.")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits.")
    private String phoneNo;

    @Size(max = 20, message = "Roll number must be at most 20 characters.")
    @Pattern(regexp = "^$|^[A-Za-z0-9._-]{1,20}$", message = "Roll number must be 1 to 20 alphanumeric characters.")
    private String rollNo;
}
