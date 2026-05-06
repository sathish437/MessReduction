package com.hostel.MessReduction.DTO.ResDTO;

import com.hostel.MessReduction.Entity.Role;
import jakarta.persistence.Column;
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
public class StaffUsersResDTO {
    @NotNull
    private Long userId;
    @NotNull
    private Role role;
    @NotBlank
    private String userName;
    @NotBlank
    private String password;
    @NotBlank
    @Email
    private String gmail;
}
