package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentReqDTO {
    @NotBlank(message = "Department Code is required")
    private String departmentCode;

    @NotBlank(message = "Department Name is required")
    private String departmentName;

    @NotBlank(message = "Short Name is required")
    private String shortName;

    private String description;

    private Integer displayOrder = 0;

    private Boolean isActive = true;
}
