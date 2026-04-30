package com.hostel.MessReduction.DTO.ReqDTO;

import com.hostel.MessReduction.Entity.Role;
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
public class StaffUsersReqDTO {
    @NotNull
    private Role role;
    @NotBlank
    private String userName;
    @NotBlank
    private String password;
}
