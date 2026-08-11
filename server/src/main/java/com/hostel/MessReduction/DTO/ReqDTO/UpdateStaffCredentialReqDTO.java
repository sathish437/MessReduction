package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStaffCredentialReqDTO {
    @NotBlank(message = "Username is required")
    private String username;

    private String password;

    @Email(message = "Please provide a valid email address")
    private String gmail;

    private String phoneNo;

    public UpdateStaffCredentialReqDTO(String username, String password) {
        this.username = username;
        this.password = password;
    }
}
