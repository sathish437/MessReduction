package com.hostel.MessReduction.DTO.ReqDTO;

import com.hostel.MessReduction.Entity.Role;
import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StaffUsersReqDTO {
    private Role role;
    @NotBlank
    private String userName;
    @NotBlank
    private String password;
    @NotBlank
    @Email
    private String gmail;
}
