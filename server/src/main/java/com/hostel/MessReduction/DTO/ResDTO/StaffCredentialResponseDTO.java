package com.hostel.MessReduction.DTO.ResDTO;

import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaffCredentialResponseDTO {
    private Long id;
    private Role role;
    private String username;
    private Gender gender;
    private Integer year;
    private String gmail;
    private String phoneNo;
}
