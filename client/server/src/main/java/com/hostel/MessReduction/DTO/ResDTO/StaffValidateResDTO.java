package com.hostel.MessReduction.DTO.ResDTO;

import com.hostel.MessReduction.Entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffValidateResDTO {
    private boolean valid;
    private String username;
    private Role role;
}
